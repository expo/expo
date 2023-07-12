<p>
  <a href="https://docs.expo.dev/versions/latest/sdk/filesystem/">
    <img
      src="../../.github/resources/expo-file-system.svg"
      alt="expo-file-system"
      height="64" />
  </a>
</p>

Provides access to the local file system on the device.

# API documentation

- [Documentation for the main branch](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/filesystem.mdx)
- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/filesystem/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/filesystem/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

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
