#!/usr/bin/env bash

set -eo pipefail

if [[ ! -f package.json ]]; then
  echo "The current working directory is not a package's root directory"
  exit 1
fi

directory=$1
# Support `yarn clean plugin` to delete ./plugin/build/
if [[ -n $directory ]]; then
  rm -rf "$directory/build"
else
  rm -rf build
fi
