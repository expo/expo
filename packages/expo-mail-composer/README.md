# expo-mail-composer

Provides an API to compose mails using OS specific UI

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/mail-composer.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/mail-composer/)

# Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](#api-documentation). If you follow the link and there is no documentation available then this library is not yet usable within managed projects &mdash; it is likely to be included in an upcoming Expo SDK release.

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/unimodules/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
expo install expo-mail-composer
```

### Configure for iOS

Run `pod install` in the ios directory after installing the npm package.

### Configure for Android

No additional set up necessary.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
