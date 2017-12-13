#!/bin/bash

value=$(cat ~/.expo/PATH)
PATH="$PATH:$value" exp prepare-detached-build --platform android ..
# For testing
#PATH="$PATH:$value" ~/expo/universe/dev/exp/bin/exp.js prepare-detached-build --platform android ..
