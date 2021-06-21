TEST_INGRESSES = [{
    'index': 1,
    'ingress': {
        'metadata': {
            'annotations': {
                'konghq.com/methods': 'OPTIONS,GET,POST',
                'konghq.com/plugins': ('example-webservice-ip-restriction-plugin,'
                                       'example-webservice-request-transformer-plugin,'
                                       'example-webservice-cors-plugin'),
                'konghq.com/preserve-host': 'false',
                'konghq.com/strip-path': 'true',
                'kubernetes.io/ingress.class': 'kong',
            },
            'creationTimestamp': '2021-06-07T19:56:37Z',
            'generation': 1,
            'name': 'example-webservice',
            'namespace': 'default',
            'resourceVersion': '828386385',
            'selfLink': '/apis/networking.k8s.io/v1beta1/namespaces/default/ingresses/example-webservice',
            'uid': '79f393f7-1965-40c5-b7c1-256098793469',
        },
        'spec': {
            'rules': [{
                'host': 'example.com',
                'http': {
                    'paths': [{
                        'backend': {
                            'serviceName': 'example-webservice',
                            'servicePort': 80,
                        },
                        'path': '/webservice',
                    }],
                },
            }],
            'tls': [{
                'hosts': ['example.com'],
                'secretName': 'example.com',
            }],
        },
        'status': {
            'loadBalancer': {
                'ingress': [{
                    'ip': '0.0.0.0',
                }],
            },
        },
    },
    'key': 'example-webservice.default',
    'plugins': [{
        'apiVersion': 'configuration.konghq.com/v1',
        'config': {
            'allow': ['8.8.8.0/24', '2001:4860:4860::/64'],
        },
        'enabled': True,
        'kind': 'KongPlugin',
        'metadata': {
            'annotations': {},
            'creationTimestamp': '2021-06-07T17:27:17Z',
            'generation': 1,
            'name': 'example-webservice-ip-restriction-plugin',
            'namespace': 'default',
            'resourceVersion': '828154485',
            'selfLink': ('/apis/configuration.konghq.com/v1/namespaces/default/kongplugins'
                         '/example-webservice-ip-restriction-plugin'),
            'uid': '67d77702-aa12-43fb-a39e-2e571ab61e5d',
        },
        'plugin': 'ip-restriction',
    }, {
        'apiVersion': 'configuration.konghq.com/v1',
        'config': {
            'add': {
                'headers': ['X-Do-A-Thing:true'],
            },
            'remove': {
                'headers': ['X-Do-A-Thing'],
            },
        },
        'enabled': True,
        'kind': 'KongPlugin',
        'metadata': {
            'annotations': {},
            'creationTimestamp': '2021-06-07T17:27:18Z',
            'generation': 1,
            'name': 'example-webservice-request-transformer-plugin',
            'namespace': 'default',
            'resourceVersion': '828154523',
            'selfLink': ('/apis/configuration.konghq.com/v1/namespaces/default/kongplugins'
                         '/example-webservice-request-transformer-plugin'),
            'uid': '24c81a77-2026-458a-bbd9-3eeb3c5abcb0',
        },
        'plugin': 'request-transformer',
    }, {
        'apiVersion': 'configuration.konghq.com/v1',
        'config': {
            'credentials': False,
            'headers': ['authorization', 'content-type', 'x-my-header'],
            'methods': ['GET', 'POST'],
            'origins': ['*'],
        },
        'enabled': False,
        'kind': 'KongPlugin',
        'metadata': {
            'annotations': {},
            'creationTimestamp': '2021-06-07T17:27:18Z',
            'generation': 1,
            'name': 'example-webservice-cors-plugin',
            'namespace': 'default',
            'resourceVersion': '828154524',
            'selfLink': ('/apis/configuration.konghq.com/v1/namespaces/default/kongplugins'
                         '/example-webservice-cors-plugin'),
            'uid': 'df12f646-450b-4aee-a88f-0f695518d829',
        },
        'plugin': 'cors',
    }],
}, {
    'index': 2,
    'ingress': {
        'metadata': {
            'annotations': {
                'konghq.com/methods': 'GET',
                'konghq.com/preserve-host': 'true',
                'konghq.com/strip-path': 'true',
                'kubernetes.io/ingress.class': 'kong',
            },
            'creationTimestamp': '2021-06-07T19:55:42Z',
            'generation': 1,
            'name': 'test-api',
            'namespace': 'default',
            'resourceVersion': '828257428',
            'selfLink': '/apis/networking.k8s.io/v1beta1/namespaces/default/ingresses/test-api',
            'uid': 'fc080d62-d4d3-4515-9a2e-1faa3cd29aef',
        },
        'spec': {
            'rules': [{
                'host': 'api.example.com',
                'http': {
                    'paths': [{
                        'backend': {
                            'serviceName': 'test-api',
                            'servicePort': 3843,
                        },
                        'path': '/api',
                    }],
                },
            }],
            'tls': [{
                'hosts': ['api.example.com'],
                'secretName': 'example.com',
            }],
        },
        'status': {
            'loadBalancer': {
                'ingress': [{
                    'ip': '0.0.0.0',
                }],
            },
        },
    },
    'key': 'test-api.default',
    'plugins': [],
}, {
    'index': 3,
    'ingress': {
        'metadata': {
            'annotations': {
                'konghq.com/methods': 'OPTIONS,GET,HEAD',
                'konghq.com/plugins': 'example-webpage-rate-limiting-plugin',
                'konghq.com/preserve-host': 'true',
                'konghq.com/strip-path': 'true',
                'kubernetes.io/ingress.class': 'kong',
            },
            'creationTimestamp': '2021-06-07T17:37:13Z',
            'generation': 1,
            'name': 'example-webpage',
            'namespace': 'kuick',
            'resourceVersion': '828161831',
            'selfLink': '/apis/networking.k8s.io/v1beta1/namespaces/kuick/ingresses/example-webpage',
            'uid': '0b4a04ef-37e0-42f8-895c-da753fcdcf98',
        },
        'spec': {
            'rules': [{
                'host': 'www.example.com',
                'http': {
                    'paths': [{
                        'backend': {
                            'serviceName': 'example-webpage',
                            'servicePort': 80,
                        },
                    }],
                },
            }, {
                'host': 'example.com',
                'http': {
                    'paths': [{
                        'backend': {
                            'serviceName': 'example-webpage',
                            'servicePort': 80,
                        },
                    }],
                },
            }],
            'tls': [{
                'hosts': ['www.example.com', 'example.com'],
                'secretName': 'example.com',
            }],
        },
        'status': {
            'loadBalancer': {
                'ingress': [{
                    'ip': '0.0.0.0',
                }],
            },
        },
    },
    'key': 'example-webpage.kuick',
    'plugins': [{
        'apiVersion': 'configuration.konghq.com/v1',
        'config': {
            'fault_tolerant': True,
            'hide_client_headers': False,
            'limit_by': 'ip',
            'policy': 'local',
            'redis_database': 0,
            'redis_port': 6379,
            'redis_timeout': 2000,
            'second': 1000,
        },
        'enabled': True,
        'kind': 'KongPlugin',
        'metadata': {
            'annotations': {},
            'creationTimestamp': '2021-06-07T17:27:18Z',
            'generation': 1,
            'name': 'example-webpage-rate-limiting-plugin',
            'namespace': 'kuick',
            'resourceVersion': '828154529',
            'selfLink': ('/apis/configuration.konghq.com/v1/namespaces/kuick/kongplugins'
                         '/example-webpage-rate-limiting-plugin'),
            'uid': '80cca21d-70bc-445f-8301-615b10f91617',
        },
        'plugin': 'rate-limiting',
    }],
}]
