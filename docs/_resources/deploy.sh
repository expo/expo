#!/bin/sh

set -e

BASEDIR=$(dirname "$0")
$BASEDIR/build-docs.sh

docker build -t gcr.io/exponentjs/docs:latest .
gcloud docker push gcr.io/exponentjs/docs:latest
deis pull gcr.io/exponentjs/docs:latest -a docs
