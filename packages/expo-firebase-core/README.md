# expo-firebase-core

This module provides access to the Firebase configuration and performs initialisation
of the native Firebase App. Unimodules that want to use Firebase can use
this module to get safe access to the native Firebase App.

# API documentation

- [Documentation for the main branch](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/firebase-core.md)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/firebase-core/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
expo install expo-firebase-core
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.

[Add the iOS `GoogleService-Info.plist` to your XCode project](https://firebase.google.com/docs/ios/setup#add-config-file)

### Configure for Android

[Add the Android `google-services.json` to your `android/app` folder](https://firebase.google.com/docs/android/setup#add-config-file)

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
