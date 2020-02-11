
# expo-firebase-core

Core support for the native Google Firebase SDK. This library ensures that Google Firebase is initialized natively and makes it possible to use 
native Firebase features from other unimodules.

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/firebase-core.md)

# Installation in managed Expo projects

For [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](#api-documentation). If you follow the link and there is no documentation available then this library is not yet usable within managed projects &mdash; it is likely to be included in an upcoming Expo SDK release.

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/unimodules/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
expo install expo-firebase-core
```

### Configure for iOS

Run `pod install` in the ios directory after installing the npm package.

[Add the iOS `GoogleService-Info.plist` to your XCode project](https://firebase.google.com/docs/ios/setup#add-config-file)

### Configure for Android

[Add the Android `google-services.json` to your `android/app` folder](https://firebase.google.com/docs/android/setup#add-config-file)


# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).