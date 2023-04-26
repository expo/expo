<p>
  <a href="https://docs.expo.dev/versions/latest/sdk/haptics/">
    <img
      src="../../.github/resources/expo-haptics.svg"
      alt="expo-haptics"
      height="64" />
  </a>
</p>

Provides access to the system's haptics engine on iOS and vibration effects on Android.

# API documentation

- [Documentation for the main branch](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/haptics.mdx)
- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/haptics/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/haptics/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npx expo install expo-haptics
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.

### Configure for Android

No additional set up necessary.

This module requires permission to control vibration on the device, it's added automatically.

```xml
<!-- Added permissions -->
<uses-permission android:name="android.permission.VIBRATE" />
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
