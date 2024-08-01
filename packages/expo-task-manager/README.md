# expo-task-manager

Expo universal module for TaskManager API.

## API documentation

- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/task-manager/)
- [Documentation for the main branch](https://docs.expo.dev/versions/unversioned/sdk/task-manager/)

## Installation

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/task-manager/).

## Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npx expo install expo-task-manager
```

#### Configure for Android

No additional set up necessary.

#### Configure for iOS

Run `npx pod-install` after installing the npm package.

To use `TaskManager` API in standalone, detached and bare apps on iOS, your app has to include background mode in the `Info.plist` file. See [background tasks configuration guide](https://docs.expo.dev/versions/latest/sdk/task-manager/#configuration-for-standalone-apps) for more details.

# Contributing

Contributions are welcome! Please refer to the guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
