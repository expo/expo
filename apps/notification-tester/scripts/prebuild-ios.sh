#!/bin/bash

EXPO_NO_GIT_STATUS=1 EXPO_DEBUG=1 npx expo prebuild --clean -p ios --template expo-template-bare-minimum@sdk-53
