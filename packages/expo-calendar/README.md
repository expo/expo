# expo-calendar

Provides an API for interacting with the device's system calendars, events, reminders, and associated records.

# API documentation

- [Documentation for the main branch](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/calendar.md)
- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/calendar/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/calendar/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
expo install expo-calendar
```

### Configure for iOS

Add `NSCalendarsUsageDescription`, and `NSRemindersUsageDescription` keys to your `Info.plist`:

```xml
<key>NSCalendarsUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to access your calendar</string>
<key>NSRemindersUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to access your reminders</string>
```

Run `npx pod-install` after installing the npm package.

### Configure for Android

Add `android.permission.READ_CALENDAR` and `android.permission.WRITE_CALENDAR` permissions to your manifest (`android/app/src/main/AndroidManifest.xml`):

```xml
<uses-permission android:name="android.permission.READ_CALENDAR" />
<uses-permission android:name="android.permission.WRITE_CALENDAR" />
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
