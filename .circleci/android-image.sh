#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )/../"
pushd "$DIR" || exit 1

set -xe

imageName="dikaiosune/android-oss-ci"
tag="$1"

tagargs=""
if [[ ! -z $tag ]]; then
  tagargs="--tag $imageName:$tag"
fi

docker build $tagargs --file .circleci/android.Dockerfile .

set +x
echo
echo "Android CI docker build complete. If you are auth'd, you can publish it with:"
echo
echo "    $ docker push $imageName:$tag"
echo
