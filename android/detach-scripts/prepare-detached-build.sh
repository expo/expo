#!/bin/bash

value=$(cat ~/.expo/PATH)
PATH="$PATH:$value" exp prepare-detached-build --platform android
