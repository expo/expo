# expo-image-picker

Provides access to the system's UI for selecting images and videos from the phone's library or taking a photo with the camera.

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/imagepicker.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/imagepicker/)

# Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/imagepicker/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/expo/expo/tree/master/packages/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
expo install expo-image-picker
```

### Configure for iOS

Add `NSPhotoLibraryUsageDescription` key to your `Info.plist`:

```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>Give $(PRODUCT_NAME) permission to save photos</string>
```

Run `npx pod-install` after installing the npm package.

### Configure for Android

This package automatically adds the `CAMERA`, `READ_EXTERNAL_STORAGE`, and `WRITE_EXTERNAL_STORAGE` permissions. They are used when picking images from the camera directly, or from the camera roll.

```xml
<!-- Added permissions -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

In `AndroidManifest.xml` add the following `activity` within `application`:

```xml
<activity
  android:name="com.theartofdev.edmodo.cropper.CropImageActivity"
  android:theme="@style/Base.Theme.AppCompat">
</activity>
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
