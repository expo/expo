# expo-media-library

Provides access to user's media library.

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/media-library.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/media-library/)

# Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/media-library/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/unimodules/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
expo install expo-media-library
```

### Configure for iOS

Add `NSPhotoLibraryUsageDescription` key to your `Info.plist`:

```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>Give $(PRODUCT_NAME) permission to save photos</string>
```

Run `npx pod-install` after installing the npm package.

### Configure for Android

This package automatically adds the `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` permissions. They are used when accessing the user's images or videos.

```xml
<!-- Added permissions -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
