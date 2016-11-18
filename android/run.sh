#!/bin/bash

./gradlew ${1:-installDevDebug} --stacktrace && adb shell am start -n host.exp.exponent/host.exp.exponent.LauncherActivity
