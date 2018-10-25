#!/usr/bin/env bash

value=$(cat ~/.expo/PATH)
PATH="$PATH:$value" expo "$@"
