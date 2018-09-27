#!/usr/bin/env bash

set -xeo pipefail

tag="$1"

echo $tag

docs="$(pwd)"

if [[ "$docs" != "$EXPO_UNIVERSE_DIR/docs" ]]
then
  echo 'not in docs directory'
  exit 1
fi

owner="gcr.io/exponentjs"
image="exponent-docs-v2"
if [ ! -z "$tag" ]; then
  tagargs="-t $owner/$image:$tag -t $owner/$image:latest"
fi

echo tagargs

# shellcheck disable=SC2086
gcloud docker -- build $tagargs .

if [ ! -z "$tag" ]; then
  gcloud docker -- push "$owner/$image:$tag"
  gcloud docker -- push "$owner/$image:latest"
fi
