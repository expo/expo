# expo-facebook

Expo universal module for Facebook SDK

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/facebook.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/facebook/)

# Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/facebook/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/expo/expo/tree/master/packages/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
expo install expo-facebook
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.

Add `NSUserTrackingUsageDescription` key to your `Info.plist`:

```xml
<key>NSUserTrackingUsageDescription</key>
<string>This identifier will be used to deliver personalized ads to you.</string>
```

Add the required `SKAdNetworkIdentifier` items to your `Info.plist`: [Facebook SKAdNetwork](https://developers.facebook.com/docs/SKAdNetwork).

Finally, create a blank Swift file in your project (we recommend naming it `noop-file.swift`). Learn more: [FBSDK blank Swift file](https://github.com/facebook/react-native-fbsdk/issues/755).

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

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
