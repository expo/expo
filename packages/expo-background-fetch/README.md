# expo-background-fetch

Expo universal module for BackgroundFetch API

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/background-fetch.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/background-fetch/)

# Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/background-fetch/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/unimodules/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
expo install expo-background-fetch
```

### Configure for iOS

Run `pod install` in the ios directory after installing the npm package.

In order to use `BackgroundFetch` API in standalone, detached and bare apps on iOS, your app has to include background mode in the `Info.plist` file. See [background tasks configuration guide](https://docs.expo.io/versions/latest/sdk/task-manager/#configuration-for-standalone-apps) for more details.

### Configure for Android

No additional set up necessary.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
