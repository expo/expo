#!/bin/bash

value=$(cat ~/.expo/PATH)
PATH="$PATH:$value" expo "$@"
