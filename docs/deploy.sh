#!/usr/bin/env bash

set -xeo pipefail

environment=$1

if [ "$environment" == "production" ]; then
  export REPLICAS=2
  export INGRESS_HOSTNAME=next-docs.expo.io
  export ENVIRONMENT=production
elif [ "$environment" == "staging" ]; then
  export REPLICAS=1
  export INGRESS_HOSTNAME=staging.next-docs.expo.io
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

envsubst < ./docs.k8s.template.yml | kubectl apply -f -