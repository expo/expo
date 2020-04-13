# expo-ads-admob

Provides support for the Google AdMob SDK (https://www.google.com/admob/) for mobile advertising. This module is largely based of the react-native-admob (https://github.com/sbugert/react-native-admob) module, as the documentation and questions surrounding that module may prove helpful. A simple example implementing AdMob SDK can be found at https://github.com/deadcoder0904/expo-google-admob.

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/admob.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/admob/)

# Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/admob/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/unimodules/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
expo install expo-ads-admob
```

### Configure for iOS

Run `pod install` in the ios directory after installing the npm package.

In your app's `Info.plist` file, add a `GADApplicationIdentifier` key with a string value of your AdMob app ID, as shown in Google's [Mobile Ads SDK iOS docs](https://developers.google.com/admob/ios/quick-start#update_your_infoplist).

```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-3940256099942544~1458002511</string>
```

### Configure for Android

No additional set up necessary.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).
