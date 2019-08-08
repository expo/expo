# expo-facebook

Expo universal module for Facebook SDK

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/facebook.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/facebook/)

# Installation

This package is pre-installed in [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects. You may skip the rest of the installation guide if this applies to you.

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/unimodules/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
npm install expo-facebook
```

### Configure for iOS

Run `pod install` in the ios directory after installing the npm package.

### Configure for Android

No additional set up necessary.

In `AndroidManifest.xml`, add the following element within your `<application>` element:

```xml
...
      <!-- The Facebook SDK runs FacebookInitProvider on startup and crashes if there isn't an ID here -->
    <meta-data android:name="com.facebook.sdk.ApplicationId" android:value="fb0"/>
  </application>
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
