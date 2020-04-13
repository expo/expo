# expo-payments-stripe

Provides support for payments through Stripe and Apple Pay on iOS (in ExpoKit and bare apps), and Stripe on Android (plus Android Pay with ExpoKit and bare apps).

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/payments.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/payments/)

# Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/payments/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/unimodules/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
expo install expo-payments-stripe
```

### Configure for iOS

Run `pod install` in the ios directory after installing the npm package.

### Configure for Android

No additional set up necessary.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
