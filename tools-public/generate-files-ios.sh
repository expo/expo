#!/bin/bash

scriptdir=$(dirname ${BASH_SOURCE[0]})

pushd "$scriptdir"

mkdir -p ../ios/Exponent/Generated/
gulp generate-dynamic-macros --platform ios --buildConstantsPath ../ios/Exponent/Supporting/EXBuildConstants.plist --infoPlistPath ../ios/Exponent/Supporting --expoKitPath ..
gulp cleanup-dynamic-macros --platform ios --infoPlistPath ../ios/Exponent/Supporting --expoKitPath ..

popd
