# expo-firebase-analytics

> **This is the only Firebase Analytics package for React Native that has universal platform support (iOS, Android, Web, and Electron).**

`expo-firebase-analytics` enables the use of native Google Analytics for Firebase. Google Analytics for Firebase is a free app measurement solution that provides insight on app usage and user engagement.
Learn more in the official [Firebase Docs](https://firebase.google.com/docs/analytics/).

# API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/firebase-analytics.md)

# Installation in managed Expo projects

For [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](#api-documentation). If you follow the link and there is no documentation available then this library is not yet usable within managed projects &mdash; it is likely to be included in an upcoming Expo SDK release.

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/unimodules/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

Install `expo-firebease-analytics` and make sure `expo-firebase-core` is also installed.

```
expo install expo-firebase-analytics expo-firebase-core
```

### Configure for iOS

Run `pod install` in the ios directory after installing the npm package.

[Add the iOS `GoogleService-Info.plist` to your XCode project](https://firebase.google.com/docs/ios/setup#add-config-file)

**Optional: Enable AdSupport**

To get extra features like `audiences`, `campaign attribution`, and some `user properties`, such as `Age` and `Interests`, you will need to include AdSupport.
This isn't enabled by default because Apple & Google are strict with allowing apps to use this library.

To enable the AdSupport framework:

- In your Xcode project, select your project's target
- Select the General tab for your target
- Expand the Linked Frameworks and Libraries section
- Click `+` to add a framework
- Select `AdSupport.framework`

[Learn more in the Firebase Docs](https://firebase.google.com/support/guides/analytics-adsupport)

### Configure for Android

[Add the Android `google-services.json` to your `android/app` folder](https://firebase.google.com/docs/android/setup#add-config-file)

### Configure for Web

Install the Firebase JavaScript SDK as a dependency:

```
expo install firebase
```

And create a firebase init file (with the `.web` extension), that initializes the firebase app.


```ts
// initFirebase.web.js
import * as firebase from 'firebase/app';
import 'firebase/analytics';

firebase.initializeApp({
  apiKey: "api-key",
  authDomain: "project-id.firebaseapp.com",
  databaseURL: "https://project-id.firebaseio.com",
  projectId: "project-id",
  storageBucket: "project-id.appspot.com",
  messagingSenderId: "sender-id",
  appId: "app-id",
  measurementId: "G-measurement-id",
});
```

[Learn more in the Firebase Docs](https://firebase.google.com/docs/web/setup)


# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).


