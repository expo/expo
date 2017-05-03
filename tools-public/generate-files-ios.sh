#!/bin/bash

mkdir -p ../ios/Exponent/Generated/
gulp generate-dynamic-macros --platform ios --buildConstantsPath ../ios/Exponent/Generated/EXDynamicMacros.h --infoPlistPath ../ios/Exponent/Supporting --expoKitPath ..
gulp cleanup-dynamic-macros --platform ios --infoPlistPath ../ios/Exponent/Supporting --expoKitPath ..
