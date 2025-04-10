#!/bin/bash

RELEASE=1 MICROFOAM_GOOGLE_SERVICES_JSON=~/google-services-microfoam-vonovak.json EXPO_NO_GIT_STATUS=1 EXPO_DEBUG=1 npx expo prebuild --clean -p android --template expo-template-bare-minimum@sdk-53


echo 'include(":expo-modules-test-core")' >> ./android/settings.gradle
echo 'project(":expo-modules-test-core").projectDir = new File("../../../packages/expo-modules-test-core/android")' >> ./android/settings.gradle
