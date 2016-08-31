FROM gcr.io/exponentjs/node-base:6.4.0-0

ADD .npmrc /root/.npmrc
ADD node_modules-tarballs /root/node_modules-tarballs

RUN mkdir -p /workdir
WORKDIR /workdir

ADD ./tools-public/package.json ./tools-public/package.json
ADD ./tools-public/kpm.lock ./tools-public/kpm.lock
RUN cd ./tools-public && kpm i

COPY . .

RUN mkdir -p ./tmp ./logs ./shell-apps
