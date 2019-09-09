#!/usr/bin/env bash
# Copyright 2019-present 650 Industries. All rights reserved.

# exit when any command fails
set -e

sed 's#git@github.com:#https://github.com/#g' $1 > $2
