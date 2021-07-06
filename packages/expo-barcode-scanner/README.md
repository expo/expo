# expo-barcode-scanner

Allows scanning variety of supported barcodes both as standalone module and as extension for expo-camera. It also allows scanning barcodes from existing images.

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/bar-code-scanner.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/bar-code-scanner/)

# Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/bar-code-scanner/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/expo/expo/tree/master/packages/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
expo install expo-barcode-scanner
```

### Configure for iOS

Add `NSCameraUsageDescription` and `NSMicrophoneUsageDescription` key to your `Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to use the camera</string>
<key>NSMicrophoneUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to use the microphone</string>
```

Run `npx pod-install` after installing the npm package.

### Configure for Android

This package automatically adds the `CAMERA` permission to your app.

```xml
<!-- Added permissions -->
<uses-permission android:name="android.permission.CAMERA" />
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
