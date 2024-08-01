<p>
  <a href="https://docs.expo.dev/versions/latest/sdk/brightness/">
    <img
      src="../../.github/resources/expo-brightness.svg"
      alt="expo-brightness"
      height="64" />
  </a>
</p>

Provides an API to get and set screen brightness.

# API documentation

- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/brightness/)
- [Documentation for the main branch](https://docs.expo.dev/versions/unversioned/sdk/brightness/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/brightness/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npx expo install expo-brightness
```

### Configure for Android

Add `android.permission.WRITE_SETTINGS` permission to your manifest (`android/app/src/main/AndroidManifest.xml`):

```xml
<uses-permission android:name="android.permission.WRITE_SETTINGS" />
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
