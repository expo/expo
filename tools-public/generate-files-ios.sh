#!/bin/bash

scriptdir=$(dirname ${BASH_SOURCE[0]})

mkdir -p ../ios/Exponent/Generated/
$scriptdir/node_modules/.bin/gulp generate-dynamic-macros --platform ios --buildConstantsPath ../ios/Exponent/Supporting/EXBuildConstants.plist --infoPlistPath ../ios/Exponent/Supporting --expoKitPath ..
$scriptdir/node_modules/.bin/gulp cleanup-dynamic-macros --platform ios --infoPlistPath ../ios/Exponent/Supporting --expoKitPath ..
