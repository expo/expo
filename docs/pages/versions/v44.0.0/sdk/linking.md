---
title: Linking
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-44/packages/expo/src/Linking'
---

import APISection from '~/components/plugins/APISection';
import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

`expo-linking` provides utilities for your app to interact with other installed apps using deep links. It also provides helper methods for constructing and parsing deep links into your app. This module is an extension of the React Native [Linking](https://reactnative.dev/docs/linking.html) module.

For a more comprehensive explanation of how to use `expo-linking`, refer to the [Linking guide](../../../guides/linking.md).

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="expo-linking" />

## API

```js
import * as Linking from 'expo-linking';
```

<APISection packageName="expo-linking" apiName="Linking" />