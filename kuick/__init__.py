from flask import Flask, render_template, request
from kubernetes import client, config
from os import environ
from typing import List

KONG_PLUGINS_OBJECT_DESC = ['configuration.konghq.com', 'v1', 'kongplugins']
INGRESSES_OBJECT_DESC = ['networking.k8s.io', 'v1beta1', 'ingresses']


def init() -> Flask:
    app = Flask(__name__, template_folder='templates', static_folder='static')
    is_test_mode = environ.get('TEST_MODE', '').strip().lower() == 'true'

    if is_test_mode:
        from kuick.test_data import TEST_INGRESSES

        print('WARNING: Running kuick in test mode')

        @app.route('/')
        def index():
            return render_template(
                'index.html.jinja',
                x_forwarded_prefix=request.headers.get('x-forwarded-prefix', ''),
                kong_ingresses=TEST_INGRESSES,
                is_test_mode=is_test_mode)

        @app.route('/api/v1/ingresses')
        def api_v1_ingresses():
            return {'apiVersion': 1, 'isTestMode': True, 'data': TEST_INGRESSES}

    else:
        config.load_incluster_config()
        custom_objects_api = client.CustomObjectsApi()

        def fetch_kong_ingresses() -> List[dict]:
            kong_plugins = {(plugin['metadata']['name'], plugin['metadata']['namespace']): plugin for plugin in
                            custom_objects_api.list_cluster_custom_object(*KONG_PLUGINS_OBJECT_DESC)['items']}
            kong_ingresses: list[dict] = []
            index = 1
            for ingress in custom_objects_api.list_cluster_custom_object(*INGRESSES_OBJECT_DESC)['items']:
                if ingress['metadata']['annotations'].get('kubernetes.io/ingress.class') == 'kong':
                    plugins: list[dict] = []
                    for plugin_name in ingress['metadata']['annotations'].get('konghq.com/plugins', '').split(','):
                        plugin = kong_plugins.get((plugin_name, ingress['metadata']['namespace']))
                        if plugin:
                            plugins.append(plugin)
                    kong_ingresses.append({
                        'index': index,
                        'key': f'{ingress["metadata"]["name"]}.{ingress["metadata"]["namespace"]}',
                        'ingress': ingress,
                        'plugins': plugins,
                    })
                    index += 1
            return kong_ingresses

        @app.route('/')
        def index():
            return render_template(
                'index.html.jinja',
                x_forwarded_prefix=request.headers.get('x-forwarded-prefix', ''),
                kong_ingresses=fetch_kong_ingresses(),
                is_test_mode=is_test_mode)

        @app.route('/api/v1/ingresses')
        def api_v1_ingresses():
            return {'apiVersion': 1, 'data': fetch_kong_ingresses()}

    # @app.errorhandler(werkzeug.exceptions.NotFound)
    # def handler_not_found(e):
    #     print(f'DEBUG: 404 error for uri {request.url} host {request.headers.get("host", "???")}')
    #     return {'error': 'not found'}, 404

    return app
