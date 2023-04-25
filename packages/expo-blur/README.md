<p>
  <a href="https://docs.expo.dev/versions/latest/sdk/blur-view/">
    <img
      src="../../.github/resources/expo-blur.svg"
      alt="expo-blur"
      height="64" />
  </a>
</p>

A component that renders a native blur view on iOS and falls back to a semi-transparent view on Android. A common usage of this is for navigation bars, tab bars, and modals.

# API documentation

- [Documentation for the main branch](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/blur-view.mdx)
- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/blur-view/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/blur-view/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npx expo install expo-blur
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.

### Configure for Android

This package only supports iOS. On Android, a plain `View` with a translucent background will be rendered.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
