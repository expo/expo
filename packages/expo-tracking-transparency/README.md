# expo-tracking-transparency

A library for requesting permission to track the user or their device. Examples of data used for tracking include email address, device ID, advertising ID, etc... This permission is only necessary on iOS 14 and higher; on iOS 13 and below this permission is always granted. If the "Allow Apps to Request to Track" device-level setting is off, this permission will be denied.

For more information on Apple's new App Tracking Transparency framework, please refer to their [documentation](https://developer.apple.com/app-store/user-privacy-and-data-use/).

## API documentation

- [Documentation for the main branch](https://github.com/expo/expo/blob/main/docs/pages/versions/unversioned/sdk/tracking-transparency.md)
- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/tracking-transparency/)

## Installation in managed Expo projects

For [managed](https://docs.expo.dev/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/tracking-transparency/).

## Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
expo install expo-tracking-transparency
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.

Add `NSUserTrackingUsageDescription` key to your `Info.plist`:

```xml
<key>NSUserTrackingUsageDescription</key>
<string>Your custom usage description string here.</string>
```

### Configure for Android

No additional set up necessary.

## Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
