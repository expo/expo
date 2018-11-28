#!/bin/bash

./gradlew ${1:-installDevMinSdkDevKernelDebug} --stacktrace && adb shell am start -n host.exp.firebase/host.exp.exponent.MainActivity
