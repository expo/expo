# expo-background-fetch

Expo universal module for BackgroundFetch API

# API documentation

- [Documentation for the main branch](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/background-fetch.md)
- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/background-fetch/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/background-fetch/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
expo install expo-background-fetch
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.

In order to use `BackgroundFetch` API in standalone, detached and bare apps on iOS, your app has to include background mode in the `Info.plist` file. See [background tasks configuration guide](https://docs.expo.dev/versions/latest/sdk/task-manager/#configuration-for-standalone-apps) for more details.

### Configure for Android

No additional set up necessary.

This module might listen when the device is starting up. It's necessary to continue working on tasks started with `startOnBoot`. It also keeps devices "awake" that are going idle and asleep fast, to improve reliability of the tasks.

```xml
<!-- Added permissions -->
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
