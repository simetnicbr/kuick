################################################################################
# CSS builder
################################################################################
FROM node:16-alpine AS webapp-builder

COPY package.json package-lock.json /src/app/
WORKDIR /src/app
RUN npm install
ENV NODE_ENV production

COPY kuick /src/app/kuick
COPY src /src/app/src

COPY tailwind.config.js /src/app/
RUN npm run build:css

COPY webpack.config.js tsconfig.json /src/app/
RUN npm run build:js

################################################################################
# Server
################################################################################
FROM python:3.8-slim

RUN apt-get update && \
    apt-get install --no-install-recommends -y build-essential libssl-dev

COPY requirements.txt /src/app/
WORKDIR /src/app
RUN pip install -r requirements.txt

COPY .flake8 wsgi.py /src/app/
COPY kuick /src/app/kuick
RUN flake8

COPY --from=webapp-builder /src/app/kuick/static/js/ /src/app/kuick/static/js/
COPY --from=webapp-builder /src/app/kuick/static/css/ /src/app/kuick/static/css/

ENV PORT 8080

CMD uwsgi --http 0.0.0.0:${PORT} --gevent 1000 --master --wsgi-file wsgi.py --callable app --need-app
