# expo-app-loading

A React component that tells Expo to keep the app loading screen open if it is the first and only component rendered in your app. Unless the `autoHideSplash` prop is set to `false`, the loading screen will disappear and your app will be visible when the component is removed.
This is incredibly useful to let you download and cache fonts, logos, icon images and other assets that you want to be sure the user has on their device for an optimal experience before rendering and they start using the app.

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/app-loading.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/app-loading/)

# Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/app-loading/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/expo/expo/tree/master/packages/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
expo install expo-app-loading
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
