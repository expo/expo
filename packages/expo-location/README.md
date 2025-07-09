<p>
  <a href="https://docs.expo.dev/versions/latest/sdk/location/">
    <img
      src="../../.github/resources/expo-location.svg"
      alt="expo-location"
      height="64" />
  </a>
</p>

Allows reading geolocation information from the device. Your app can poll for the current location or subscribe to location update events.

# API documentation

- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/location/)
- [Documentation for the main branch](https://docs.expo.dev/versions/unversioned/sdk/location/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/location/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npx expo install expo-location
```

### Configure for Android

This module requires the permissions for approximate and exact device location. It also needs the foreground service permission to subscribe to location updates, while the app is in use. These permissions are automatically added.

```xml
<!-- Added permissions -->
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

<!-- Optional permissions -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
```

> [!note]
> On Android, you have to [submit your app for review and request access to use the background location permission](https://support.google.com/googleplay/android-developer/answer/9799150?hl=en) or [foreground location permissions](https://support.google.com/googleplay/android-developer/answer/13392821?hl=en).

### Configure for iOS

Add `NSLocationAlwaysAndWhenInUseUsageDescription`, `NSLocationAlwaysUsageDescription` and `NSLocationWhenInUseUsageDescription` keys to your `Info.plist`:

```xml
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to use your location</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to use your location</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to use your location</string>
```

Run `npx pod-install` after installing the npm package.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
