# Detox Lab

Detox Lab is where we put our latest copy of Detox (as a Git submodule) that we use to release the Exponent-Test.apk with.

## React Native submodule

The `Detox` directory is a Git submodule whose origin is `expo/Detox`. We keep it on the `exp-latest` branch, which is updated to match the most recent Detox version that Expo is compatible with (ex) `v9.0.6-expo-*` branch during each SDK update. Our `v9.0.6-expo-*` branches are based on upstream Detox releases.

### Upgrading Detox

When we support a newer version of Detox, we do the following:

- Create a new branch like `v9.0.6-expo-v32.0`, where `9.0.6` is the version of Detox we build our Exponent-Test.apk with in the SDK 32 release and update `exp-latest`

- run `git submodule update` to bring in the new changes

- run `cd tools` and run `gulp update-detox` to update the detox android directory with expolib dependencies


### To Build

- From the root project directory, run `fastlane android build build_type:Debug` and `fastlane android build build_type:DebugAndroidTest  system_properties:{\"buildType\":\"debug\"}`

- The output binaries will be in `expo/android/app/build/outputs/apk/androidTest/prodKernel/debug/app-prodKernel-debug-androidTest.apk` and `expo/android/app/build/outputs/apk/prodKernel/debug/app-prodKernel-debug.apk` respectively.

### More Info

See the docs article here  [TODO/quin]