#!/usr/bin/env bash

set -xeo pipefail

environment=$1

if [ "$environment" == "production" ]; then
  export INGRESS_HOSTNAME=docs.expo.io
  export ENVIRONMENT=production
elif [ "$environment" == "staging" ]; then
  export INGRESS_HOSTNAME=staging.docs.expo.io
  export ENVIRONMENT=staging
else
  echo "Unrecognized environment $environment"
  exit 1
fi

export TAG=$2

echo "Checking for image..."

if ! gcloud container images describe "gcr.io/exponentjs/exponent-docs-v2:$TAG"; then
  echo "Unable to find image tagged with $TAG"
  exit 2
fi

echo "Environment set, found image, deploying..."

envsubst < ./docs.k8s.template.yml | kubectl apply --namespace $environment -f -
