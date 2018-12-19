FROM mhart/alpine-node:8.9.0

RUN apk --update add bash

ENV APP_PATH "/app"
ENV NODE_ENV "production"

RUN mkdir -p /app /libraries
ADD . /app

WORKDIR /app
RUN yarn && \
    rm -rf "$(yarn cache dir)"

RUN yarn run build

EXPOSE 3000
CMD ["./node_modules/.bin/cross-env", "NODE_ENV=production", "node", "server.js"]
