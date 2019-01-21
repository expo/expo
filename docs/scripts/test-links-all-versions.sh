#!/usr/bin/env bash
set -euo pipefail

root=$1
docsDir="$(dirname "$0")/.."

pushd "$docsDir"

# TODO: add hidden links between version pages and delete this script

for v in versions/latest $(ls -d versions/v*); do
  yarn run test-links "$root/$v"
done

popd
