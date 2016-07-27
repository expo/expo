#!/bin/sh

set -e

BASEDIR=$(dirname "$0")
$BASEDIR/build-docs.sh

gcloud docker -- build -t gcr.io/exponentjs/docs:latest .
gcloud docker -- push gcr.io/exponentjs/docs:latest

kubectl --namespace production apply -f $BASEDIR/../deploy/k8s/docs-deployment.yml
