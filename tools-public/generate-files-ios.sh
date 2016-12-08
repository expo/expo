#!/bin/bash

mkdir -p ../ios/Exponent/Supporting/Generated/
gulp generate-dynamic-macros --platform ios --buildConstantsPath ../ios/Exponent/Supporting/Generated/EXDynamicMacros.h --infoPlistPath ../ios/Exponent/Supporting --exponentViewPath ..
gulp cleanup-dynamic-macros --platform ios --infoPlistPath ../ios/Exponent/Supporting --exponentViewPath ..
