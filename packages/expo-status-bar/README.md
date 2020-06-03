# expo-status-bar

Provides the same interface as the React Native [StatusBar API](https://reactnative.dev/docs/statusbar), but with slightly different defaults to work great in Expo environments.

- Default to `translucent={true}` on Android.
- The `barStyle="default"` maps to `barStyle="dark-content"` when the app is locked to light mode, and `barStyle="light-content"` when the app is locked to dark mode.

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/status-bar.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/status-bar/)

# Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/image/). If you follow the link and there is no documentation available then this library is not yet usable within managed projects &mdash; it is likely to be included in an upcoming Expo SDK release.

Please refer to the [React Native StatusBar API documentation](https://reactnative.dev/docs/statusbar).

# Installation in bare React Native projects

```
npm install expo-status-bar
```

No additional configuration is required.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
