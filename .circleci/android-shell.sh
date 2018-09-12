#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )/../"
pushd "$DIR" || exit 1

set -xe

imageName="dikaiosune/android-oss-ci"
tag="local-shell"

./.circleci/android-image.sh "$tag"

docker run \
  --interactive \
  --tty \
  --rm \
  --mount "type=bind,source=$DIR,target=/home/circleci/expo" \
  "$imageName:$tag" \
  /bin/bash
