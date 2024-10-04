<p>
  <a href="https://docs.expo.dev/versions/latest/sdk/status-bar/">
    <img
      src="../../.github/resources/expo-status-bar.svg"
      alt="expo-status-bar"
      height="64" />
  </a>
</p>

Provides the same interface as the React Native [StatusBar API](https://reactnative.dev/docs/statusbar), but with slightly different defaults to work great in Expo environments.

- Default to `translucent={true}` on Android.
- The `style="auto"` maps to a dark status bar when in light mode and a light status bar when in dark moded. `style="inverted"` inverts this behavior.

# API documentation

- [Documentation for the main branch](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/status-bar.mdx)
- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/status-bar/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/image/). If you follow the link and there is no documentation available then this library is not yet usable within managed projects &mdash; it is likely to be included in an upcoming Expo SDK release.

Please refer to the [React Native StatusBar API documentation](https://reactnative.dev/docs/statusbar).

# Installation in bare React Native projects

```
npm install expo-status-bar
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.

### Configure for Android

No additional setup necessary.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
