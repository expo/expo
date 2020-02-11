---
title: Firebase
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-36/packages/expo-firebase-core'
---

import TableOfContentSection from '~/components/plugins/TableOfContentSection';

**`expo-firebase-core`** ensures that native Google Firebase features can be used in your app.

#### Platform Compatibility

| Android Device | Android Emulator | iOS Device | iOS Simulator | Web |
| -------------- | ---------------- | ---------- | ------------- | --- |
| ✅              | ✅                | ✅          | ✅             | ❌   |

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-firebase-core`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-firebase-core).


## Configuration

To use this package, the Firebase configuration needs to be added to your app.
[Please follow this guide on how to configure Native Firebase.](../../guides/setup-native-firebase)


## API

```js
import FirebaseCore from 'expo-firebase-core';
```

<TableOfContentSection title='Constants' contents={['FirebaseCore.DEFAULT_APP_NAME']} />

## Constants

### `FirebaseCore.DEFAULT_APP_NAME`

Name of the default Firebase-app. In the Expo client this returns the name of a "sandboxed" firebase app for your project.
In most other cases this returns the name `[DEFAULT]`.

### `FirebaseCore.DEFAULT_APP_OPTIONS`

Object containing the firebase options with which the default app was initialized. If no google services configuration was provided, `undefined` is returned.

#### Example

```javascript
console.log(DEFAULT_APP_OPTIONS);
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

#
