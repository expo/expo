#!/bin/bash

pod install
pushd ..
exp prepare-detached-build --platform ios
popd
