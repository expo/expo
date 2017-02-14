#!/bin/bash

pod install

pushd ..
# resolve possible packager conflicts introduced by pod install
exp prepare-detached-build --platform ios --skipXcodeConfig 1
popd

echo "Finished installing and cleaning up dependencies. Be sure and serve or restart your project with `exp r -c`"
