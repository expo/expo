#!/usr/bin/env bash
# Copyright 2019-present 650 Industries. All rights reserved.

set -e

sed 's#git@github.com:#https://github.com/#g' $1
