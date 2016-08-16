FROM kyma/docker-nginx

ARG DOCS_VERSION=""
ENV DOCS_VERSION $DOCS_VERSION

COPY ./_build/html/ /var/www
COPY ./deploy/nginx/default /etc/nginx/sites-enabled/default.template

CMD /bin/bash -c "envsubst < /etc/nginx/sites-enabled/default.template > /etc/nginx/sites-enabled/default && rm -rf /etc/nginx/sites-enabled/default.template && nginx"
EXPOSE 80
