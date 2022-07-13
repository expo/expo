# expo-local-authentication

Provides an API for FaceID and TouchID (iOS) or the Fingerprint API (Android) to authenticate the user with a face or fingerprint scan.

# API documentation

- [Documentation for the main branch](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/local-authentication.md)
- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/local-authentication/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/local-authentication/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
expo install expo-local-authentication
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.

Add `NSFaceIDUsageDescription` to your `Info.plist`:

```xml
<key>NSFaceIDUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to use FaceID</string>
```

### Configure for Android

No additional set up necessary.

This module requires permissions to access the biometric data for authentication purposes. The `USE_BIOMETRIC` and `USE_FINGERPRINT` permissions are automatically added.

```xml
<!-- Added permissions -->
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.USE_FINGERPRINT" />
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
