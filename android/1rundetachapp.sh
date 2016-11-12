#!/bin/bash

./gradlew :DetachAppTemplate:installDebug && adb shell am start -n detach.app.template.pkg.name/detach.app.template.pkg.name.MainActivity
