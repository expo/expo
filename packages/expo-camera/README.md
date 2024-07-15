<p>
  <a href="https://docs.expo.dev/versions/latest/sdk/camera/">
    <img
      src="../../.github/resources/expo-camera.svg"
      alt="expo-camera"
      height="64" />
  </a>
</p>

A React component that renders a preview for the device's either front or back camera. Camera's parameters like zoom, auto focus, white balance and flash mode are adjustable. With expo-camera, one can also take photos and record videos that are saved to the app's cache. Morever, the component is also capable of detecting faces and bar codes appearing on the preview.

# API documentation

- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/camera/)
- [Documentation for the main branch](https://docs.expo.dev/versions/unversioned/sdk/camera/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/camera/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npx expo install expo-camera
```

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

The sourcecode for `cameraview` can be found at [`expo/cameraview`](https://github.com/expo/cameraview).

### Configure for iOS

Add `NSCameraUsageDescription` and `NSMicrophoneUsageDescription` keys to your `Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to use the camera</string>
<key>NSMicrophoneUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to use the microphone</string>
```

Run `npx pod-install` after installing the npm package.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
