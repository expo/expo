#!/bin/bash

value=$(cat ~/.exponent/PATH)
PATH="$PATH:$value" exp prepare-detached-build --platform android
