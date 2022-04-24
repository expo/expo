# expo-ads-admob

Provides support for the Google AdMob SDK (https://www.google.com/admob/) for mobile advertising. This module is largely based of the react-native-admob (https://github.com/sbugert/react-native-admob) module, as the documentation and questions surrounding that module may prove helpful. A simple example implementing AdMob SDK can be found at https://github.com/deadcoder0904/expo-google-admob.

# API documentation

- [Documentation for the main branch](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/admob.md)
- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/admob/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/admob/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
expo install expo-ads-admob
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.

In your app's `Info.plist` file, add a `GADApplicationIdentifier` key with a string value of your AdMob app ID, as shown in Google's [Mobile Ads SDK iOS docs](https://developers.google.com/admob/ios/quick-start#update_your_infoplist).

```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-3940256099942544~1458002511</string>
```

Add `NSUserTrackingUsageDescription` key to your `Info.plist`:

```xml
<key>NSUserTrackingUsageDescription</key>
<string>This identifier will be used to deliver personalized ads to you.</string>
```

Add the required `SKAdNetworkIdentifier` items to your `Info.plist`: [Google SKAdNetwork](https://developers.google.com/admob/ios/ios14#skadnetwork).

### Configure for Android

Ensure that there is a `meta-data` element inside the `application` node inside `AndroidManifest.xml` file (located typically under `/android/app/src/main/AndroidManifest.xml`) with `android:name` of `"com.google.android.gms.ads.APPLICATION_ID"` and a value of your AdMob App ID. Google's Mobile Ads SDK documentation shows precisely how to do this [here](https://developers.google.com/admob/android/quick-start#update_your_androidmanifestxml). In the end your `AndroidManifest.xml` should look more or less like this:

```xml
<manifest>
  <application>
    ...
    <!-- Ensure that tag with this name and proper value is inside application -->
    <meta-data
      android:name="com.google.android.gms.ads.APPLICATION_ID"
      android:value="ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy"/> <!-- App ID -->
    <!-- You can find your App ID in the AdMob UI -->
    ...
  </application>
</manifest>
```

This package automatically adds the `INTERNET` permission. It's required to interact with Google's service.

```xml
<manifest>
  <!-- Added permissions -->
  <uses-permission android:name="android.permission.INTERNET" />
</manifest>
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
