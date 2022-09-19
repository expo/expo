---
title: FirebaseCore
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-43/packages/expo-firebase-core'
---

import APISection from '~/components/plugins/APISection';
import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

`expo-firebase-core` provides access to the Firebase configuration and performs initialization of the native Firebase App.

> You do not have to configure or include this library directly in your project to use [Firebase](/guides/using-firebase). It is used as a dependency for `expo-firebase-analytics` module when used with [React Native Firebase](/versions/latest/sdk/firebase-analytics/#with-native-firebase-sdk).

<PlatformsSection android emulator ios simulator web />

## Installation

<APIInstallSection />

## API

```js
import * as FirebaseCore from 'expo-firebase-core';
```

<APISection packageName="expo-firebase-core" apiName="FirebaseCore" />
