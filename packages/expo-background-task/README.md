# expo-background-task

Expo universal module for BackgroundTask API

# API documentation

- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/background-task/)
- [Documentation for the main branch](https://docs.expo.dev/versions/unversioned/sdk/background-task/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/background-task/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npx expo install expo-background-task
```

### Configure for Android

No additional set up necessary.

### Configure for iOS

Run `npx pod-install` after installing the npm package.

In order to use `BackgroundTask` API in standalone, detached and bare apps on iOS, your app has to include the background task identifier in the `Info.plist` file. You can do this by adding the following XML snippet to your `Info.plist` file:

```xml
<key>BGTaskSchedulerPermittedIdentifiers</key>
<array>
  <string>com.expo.modules.backgroundtask.processing</string>
</array>
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
