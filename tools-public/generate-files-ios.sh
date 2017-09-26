#!/bin/bash

mkdir -p ../ios/Exponent/Generated/
gulp generate-dynamic-macros --platform ios --buildConstantsPath ../ios/Exponent/Generated/EXBuildConfig.plist --infoPlistPath ../ios/Exponent/Supporting --expoKitPath ..
gulp cleanup-dynamic-macros --platform ios --infoPlistPath ../ios/Exponent/Supporting --expoKitPath ..
