#!/bin/bash

./gradlew ${1:-installDebug} --stacktrace && adb shell am start -n io.expo.ncl/io.expo.ncl.MainActivity
