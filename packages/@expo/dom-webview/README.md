# @expo/dom-webview

The `@expo/dom-webview` module is a WebView specifically designed for DOM components. It creates a bridge between native code and the WebView, allowing you to import and use Expo modules within DOM components. While this WebView does not have full feature parity with `react-native-webview`, additional features may be added based on internal requests and evolving needs.

# API documentation

- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/@expo/dom-webview/)
- [Documentation for the main branch](https://docs.expo.dev/versions/unversioned/sdk/@expo/dom-webview/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](#api-documentation). If you follow the link and there is no documentation available then this library is not yet usable within managed projects &mdash; it is likely to be included in an upcoming Expo SDK release.

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npx expo install @expo/dom-webview
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
