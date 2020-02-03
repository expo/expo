
# expo-firebase-core

Core support for Google Firebase. This library ensures that Google Firebase is initialized natively and makes it possible to use 
Native Firebase with the Expo client.

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/firebase-core.md)

# Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](#api-documentation). If you follow the link and there is no documentation available then this library is not yet usable within managed projects &mdash; it is likely to be included in an upcoming Expo SDK release.

To use Firebase with the managed workflow, add the google-services configuration to your `app.json`:

- Add the Android `google-services.json` file to your project and link to it in your `app.json` with the `expo.android.googleServicesFile` key
- Add the iOS `GoogleService-Info.plist` file to your project and link to it in your `app.json` with the `expo.ios.googleServicesFile` key


# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/unimodules/react-native-unimodules) before continuing.

- [Add the Android `google-services.json` to your `android/app` folder](https://firebase.google.com/docs/android/setup#add-config-file)
- [Add the iOS `GoogleService-Info.plist` to your XCode project](https://firebase.google.com/docs/ios/setup#add-config-file)


### Add the package to your npm dependencies

```
expo install expo-firebase-core
```


# Docs

`expo-firebase-core` is a core library that is depended on by other `expo-firebase-xx` libraries, but is typically not used directly.

It exposes a couple constants that can be used to verify your firebase configuration.

## Constants


| Constant            | Type   | Description                                                                                                                                                   |
| ------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEFAULT_APP_NAME    | string | Name of the default Firebase-app (for managed apps, this may return a sanboxed app-name)                                                                      |
| DEFAULT_APP_OPTIONS | object | Object containing the firebase options with which the default app was initialized. If no google services configuration was provided, `undefined` is returned. |


## Example

```js
import { DEFAULT_APP_NAME, DEFAULT_APP_OPTIONS } from 'expo-firebase-core';

console.log(DEFAULT_APP_NAME, DEFAULT_APP_OPTIONS);
// {
//   appId: "1:1082251606918:ios:a2800bc715889446e24a07",
//   apiKey: "AIzaXXXXXXXX-xxxxxxxxxxxxxxxxxxx",
//   clientId: "000000000000-0000000000000.apps.googleusercontent.com",
//   trackingId: 12345567890,
//   databaseURL: "https://myexpoapp777.firebaseio.com",
//   storageBucket:  "myexpoapp777.appspot.com",
//   projectId: "myexpoapp777",
//   messagingSenderId:  123454321
// }
//
// When `DEFAULT_APP_OPTIONS` returns undefined, then your google-services
// configuration is not setup correctly.
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).