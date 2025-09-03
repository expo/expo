# Expo GlassEffect

React components that render native iOS liquid glass effect using [UIVisualEffectView](https://developer.apple.com/documentation/uikit/uivisualeffectview). Supports customizable glass styles and tint color.

# API documentation

- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/glass-effect/)
- [Documentation for the main branch](https://docs.expo.dev/versions/unversioned/sdk/glass-effect/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/glass-effect/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npx expo install expo-glass-effect
```

### Configure for Android

> [!note]
> This package only supports iOS 26+. On unsupported platforms, it will fallback to a regular `View`.

### Configure for iOS

Run `npx pod-install` after installing the npm package.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
