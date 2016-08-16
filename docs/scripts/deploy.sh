#!/bin/sh

set -e

BASEDIR=$(dirname "$0")
# $BASEDIR/build-docs.sh

gcloud docker -- build --build-arg DOCS_VERSION=${DOCS_VERSION} -t gcr.io/exponentjs/docs:latest .
gcloud docker -- push gcr.io/exponentjs/docs:latest

kubectl --namespace production apply -f $BASEDIR/../deploy/k8s/docs-deployment.yml
node $BASEDIR/restart-docs-pod.js
