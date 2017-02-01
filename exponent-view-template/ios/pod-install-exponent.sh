#!/bin/bash

pushd ..
exp stop
popd

pod install

pushd ..
# resolve possible packager conflicts introduced by pod install
exp prepare-detached-build --platform ios --skipXcodeConfig 1
exp r -c
popd
