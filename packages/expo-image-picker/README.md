# expo-image-picker

Provides access to the system's UI for selecting images and videos from the phone's library or taking a photo with the camera.

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/imagepicker.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/imagepicker/)

# Installation

This package is pre-installed in [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects. You may skip the rest of the installation guide if this applies to you.

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/unimodules/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
npm install expo-image-picker
```

### Configure for iOS

Run `pod install` in the ios directory after installing the npm package.

### Configure for Android

In `AndroidManifest.xml` add the following `activity` within `application`:

```xml
<activity
  android:name="com.theartofdev.edmodo.cropper.CropImageActivity"
  android:theme="@style/Base.Theme.AppCompat">
</activity>
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
