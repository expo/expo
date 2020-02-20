---
title: Firebase
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-36/packages/expo-firebase-core'
---

import PlatformsSection from '~/components/plugins/PlatformsSection';
import TableOfContentSection from '~/components/plugins/TableOfContentSection';

This module provides access to the Firebase configuration and performs initialisation
of the native Firebase App.

<PlatformsSection android emulator ios simulator web />

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-firebase-core`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-firebase-core).


## Configuration

To use this package, Firebase needs to be configured for your app.
[Please follow this guide on how to configure native Firebase.](../../guides/setup-native-firebase)


> No explicit calls to `expo-firebase-core` are required to initialize Firebase. This library will auto-initialize the Firebase app when a valid configuration exists.

## API

```js
import * as FirebaseCore from 'expo-firebase-core';
```

<TableOfContentSection title='Constants' contents={['FirebaseCore.DEFAULT_APP_NAME', 'FirebaseCore.DEFAULT_APP_OPTIONS']} />

## Constants

### `FirebaseCore.DEFAULT_APP_NAME`

Name of the default Firebase app (e.g. `[DEFAULT]`).

On the Expo Client a Firebase App is created for each project that is loaded, and a unique name for each project is returned.

### `FirebaseCore.DEFAULT_APP_OPTIONS`

Firebase options with which the default app was initialized. If no Google services configuration was provided, `undefined` is returned.

Depending on the platform, the options are read from the following files and `app.json` keys.

| Platform | File                       | App.json key                 |
| -------- | -------------------------- | ---------------------------- |
| iOS      | `GoogleService-Info.plist` | `ios.googleServicesFile`     |
| Android  | `google-services.json`     | `android.googleServicesFile` |
| Web      |                            | `web.config.firebase`        |

#### Example

```javascript
console.log(FirebaseCore.DEFAULT_APP_OPTIONS);
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
```

### `FirebaseCore.DEFAULT_WEB_APP_OPTIONS`

The default Firebase options as defined in `web.config.firebase` in `app.json`.

This constant is useful when you want to use the Firebase JS SDK on native.

#
