#!/usr/bin/env python3
import gevent.monkey; gevent.monkey.patch_all()  # noqa: E702
from gevent.pywsgi import WSGIServer
import os

from kuick import init

app = init()

if __name__ == '__main__':
    server = WSGIServer(('0.0.0.0', int(os.environ.get('PORT', '3000'))), app)
    server.serve_forever()
