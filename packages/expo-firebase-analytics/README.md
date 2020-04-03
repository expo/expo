# expo-firebase-analytics

> **This is the only Firebase Analytics package for React Native that has universal platform support (iOS, Android, Web, and Electron).**

`expo-firebase-analytics` enables the use of native Google Analytics for Firebase. Google Analytics for Firebase is a free app measurement solution that provides insight on app usage and user engagement.
Learn more in the official [Firebase Docs](https://firebase.google.com/docs/analytics/).

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/firebase-analytics.md)

# Installation in managed Expo projects

For [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](#api-documentation). If you follow the link and there is no documentation available then this library is not yet usable within managed projects &mdash; it is likely to be included in an upcoming Expo SDK release.

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/unimodules/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
expo install expo-firebase-analytics
```

### Configure for iOS

Run `pod install` in the ios directory after installing the npm package.

# Setup native Firebase

Follow the ["Setup Native Firebase"](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/guides/setup-native-firebase.md) guide in the docs to get started using native Firebase SDK features.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).


