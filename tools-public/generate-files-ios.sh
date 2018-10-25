#!/usr/bin/env bash
set -e

scriptdir=$(dirname ${BASH_SOURCE[0]})

pushd "$scriptdir"

mkdir -p ../ios/Exponent/Generated/
node_modules/.bin/gulp generate-dynamic-macros --platform ios --buildConstantsPath ../ios/Exponent/Supporting/EXBuildConstants.plist --infoPlistPath ../ios/Exponent/Supporting --expoKitPath ..
node_modules/.bin/gulp cleanup-dynamic-macros --platform ios --infoPlistPath ../ios/Exponent/Supporting --expoKitPath ..

popd
