# expo-camera

A React component that renders a preview for the device's either front or back camera. Camera's parameters like zoom, auto focus, white balance and flash mode are adjustable. With expo-camera, one can also take photos and record videos that are saved to the app's cache. Morever, the component is also capable of detecting faces and bar codes appearing on the preview.

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/camera.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/camera/)

# Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/camera/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/unimodules/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
expo install expo-camera
```

### Configure for iOS

Add `NSCameraUsageDescription` key to your `Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to use the camera</string>
```

Run `npx pod-install` after installing the npm package.

### Configure for Android

This package automatically adds the `CAMERA` permission to your app. If you want to record videos with audio, you have to include the `RECORD_AUDIO`.

```xml
<!-- Added permissions -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- Optional permissions -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

Adjust the `android/build.gradle` to add a new `maven` block after all other repositories as described below:

```gradle
allprojects {
    repositories {

        // * Your other repositories here *

        // * Add a new maven block after other repositories / blocks *
        maven {
            // expo-camera bundles a custom com.google.android:cameraview
            url "$rootDir/../node_modules/expo-camera/android/maven"
        }
    }
}
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
