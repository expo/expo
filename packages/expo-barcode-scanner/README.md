# expo-barcode-scanner

Allows scanning variety of supported barcodes both as standalone module and as extension for expo-camera. It also allows scanning barcodes from existing images.

# API documentation

- [Documentation for the main branch](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/bar-code-scanner.md)
- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/bar-code-scanner/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/bar-code-scanner/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

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
