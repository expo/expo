# expo-error-recovery

> **Deprecated.** This module will be removed in SDK 47. This package is not utilized in projects built outside of the deprecated classic build system (`expo build:ios` & `expo build:android`). For similar functionality, use the built-in [error handling of `expo-updates`](https://docs.expo.dev/bare/error-recovery). You can also use a third-party crash reporting service like [Sentry](https://docs.expo.dev/guides/using-sentry/) or [Bugsnag](https://docs.expo.dev/guides/using-bugsnag/) with EAS Build.

`expo-error-recovery` helps you gracefully handle crashes caused by fatal JavaScript errors.

# API documentation

- [Documentation for the main branch](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/error-recovery.md)
- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/error-recovery/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/error-recovery/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npm install expo-error-recovery
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.

### Configure for Android

No additional set up necessary.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
