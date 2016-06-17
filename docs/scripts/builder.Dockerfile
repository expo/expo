FROM mhart/alpine-node:base-6.2.1
MAINTAINER Adam Miskiewicz <adam@exp.host>

RUN apk add --update \
    python \
    python-dev \
    py-pip \
    build-base \
    git \
      && rm -rf /var/cache/apk/*

COPY ./requirements.txt /tmp/requirements.txt
RUN pip install -r /tmp/requirements.txt

WORKDIR /root/docs
