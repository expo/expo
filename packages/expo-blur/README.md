# expo-blur

A component that renders a native blur view on iOS and falls back to a semi-transparent view on Android. A common usage of this is for navigation bars, tab bars, and modals.

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/blur-view.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/blur-view/)

# Installation

This package is pre-installed in [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects. You may skip the rest of the installation guide if this applies to you.

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/unimodules/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
npm install expo-blur
```

### Configure for iOS

Run `pod install` in the ios directory after installing the npm package.

### Configure for Android

This package only supports iOS. On Android, a plain `View` with a translucent background will be rendered.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
