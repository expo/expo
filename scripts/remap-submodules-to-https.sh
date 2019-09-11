#!/usr/bin/env bash
# Copyright 2019-present 650 Industries. All rights reserved.

set -e

sed -i.bak 's#git@github.com:#https://github.com/#g' $1 >> $1
