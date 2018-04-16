#!/bin/bash

value=$(cat ~/.expo/PATH)
PATH="$PATH:$value" exp "$@"
# For testing
# PATH="$PATH:$value" ../../dev/exp/bin/exp.js "$@"
