#!/bin/bash

./gradlew ${1:-installDevMinSdkDevKernelDebug} --stacktrace && adb shell am start -n host.exp.exponent/host.exp.exponent.LauncherActivity
