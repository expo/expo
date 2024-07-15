<p>
  <a href="https://docs.expo.dev/versions/latest/sdk/cellular/">
    <img
      src="../../.github/resources/expo-cellular.svg"
      alt="expo-cellular"
      height="64" />
  </a>
</p>

Information about the user’s cellular service provider, such as its unique identifier, cellular connection type and whether it allows VoIP calls on its network.

# API documentation

- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/cellular/)
- [Documentation for the main branch](https://docs.expo.dev/versions/unversioned/sdk/cellular/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/cellular/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npx expo install expo-cellular
```

### Configure for Android

This package requires the `android.permission.READ_PHONE_STATE` be added to your `AndroidManifest.xml`, this is used for `TelephonyManager` on Android. We **do not** require the more risky `READ_PRIVILEGED_PHONE_STATE` permission.

```xml
<!-- Added permissions -->
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
