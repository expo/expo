#!/bin/bash

mkdir -p ../ios/Exponent/Supporting/Generated/
gulp generate-dynamic-macros --buildConstantsPath ../ios/Exponent/Supporting/Generated/EXDynamicMacros.h --infoPlistPath ../ios/Exponent/Supporting --platform ios
gulp cleanup-dynamic-macros --infoPlistPath ../ios/Exponent/Supporting --platform ios
