# Expo Go

For external contributors: If you want to contribute to the Expo SDK, use the [Bare Expo app](https://github.com/expo/expo/tree/main/apps/bare-expo) for developing and testing your changes (unless your changes are specific to the Expo Go app).

## Building Expo Go

1. Build React Native

You can build the React Native Android dep using `./gradlew :packages:react-native:ReactAndroid:buildCMakeDebug` in `react-native-lab/react-native` directory. This is optional because React Native will be built anyway when you build Expo Go, but can help to narrow down a potential issue surface area. 

2. Start metro in `apps/expo-go` directory

Packager needs to run prior running the build. If that's not the case you might get an error `A valid Firebase Project ID is required to communicate with Firebase server APIs.`. This is because `et android-generate-dynamic-macros` is run during the build and it needs the packager to be running.

3. Build Expo Go

For Android, run `./gradlew app:assembleDebug` in the `apps/expo-go/android` directory.

4. Run packager for Native Component List

- `cd apps/native-component-list`
- `EXPO_SDK_VERSION=UNVERSIONED npx expo start --clear`

Use the Expo Go app that you built in the previous step to scan the QR code and open the Native Component List, or hit `i` or `a` in that window to open it in Expo Go.

#### Troubleshooting

- If you see
```
error: ReferenceError: SHA-1 for file /Users/vojta/_dev/expo/react-native-lab/react-native/packages/polyfills/console.js (/Users/vojta/_dev/expo/react-native-lab/react-native/packages/polyfills/console.js) is not computed.
         Potential causes:
           1) You have symlinks in your project - watchman does not follow symlinks.
           2) Check `blockList` in your metro.config.js and make sure it isn't excluding the file path.
```

run `rm -rf ./react-native-lab/react-native/node_modules`

- If you're seeing C++ related errors, run `find . -name ".cxx" -type d -prune -exec rm -rf '{}' +` which clears `.cxx` build artifacts.
- You might need clean the project before building it. Run `./gradlew clean` in the `apps/expo-go/android` directory.
- As a "nuke" option, there's `git submodule foreach --recursive git clean -xfd` which removes all untracked files.
