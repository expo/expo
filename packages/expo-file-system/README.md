# expo-file-system

Provides access to the local file system on the device.

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/filesystem.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/filesystem/)

# Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/filesystem/).

# Installation in bare React Native projects

For bare React Native projects, this package is included in [`react-native-unimodules`](https://github.com/expo/expo/tree/master/packages/react-native-unimodules). Please refer to those installation instructions to install this package.

## Installation in bare iOS React Native project

No additional set up necessary.

## Installation in bare Android React Native project

This module requires permissions to interact with the filesystem and create resumable downloads. The `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` and `INTERNET` permissions are automatically added.

```xml
<!-- Added permissions -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.INTERNET" />
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
