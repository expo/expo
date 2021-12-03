---
title: Updates
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-44/packages/expo/src/Updates'
---

import APISection from '~/components/plugins/APISection';
import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

The `expo-updates` library allows you to programmatically control and respond to new updates made available to your app.

<PlatformsSection android emulator ios simulator />

## Installation

<InstallSection packageName="expo-updates" href="/bare/installing-updates/" />

## Usage

Most of the methods and constants in this module can only be used or tested in release mode; they do not make sense in debug builds where you always load the latest JavaScript from your computer while in development.

**To test manual updates in the Expo Go app**, run `expo publish` and then open the published version of your app with Expo Go.

**To test manual updates with managed workflow standalone apps**, you can create a [simulator build](/build-reference/simulators.md) or [APK](/build-reference/apk.md), or make a release build locally with `expo run:ios --configuration Release` and `expo run:android --variant release`.

**To test manual updates in bare workflow apps**, make a release build with `expo run:ios --configuration Release` or `expo run:android --variant release` (you don't need to submit this build to the store to test).

## API

```js
import * as Updates from 'expo-updates';
```

<APISection packageName="expo-updates" apiName="Updates" />

## Error Codes

| Code                   | Description                                                                                                                                                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ERR_UPDATES_DISABLED` | A method call was attempted when the Updates module was disabled, or the application was running in development mode                                                                                                                                          |
| `ERR_UPDATES_RELOAD`   | An error occurred when trying to reload the application and it could not be reloaded. For bare workflow apps, double check the setup steps for this module to ensure it has been installed correctly and the proper native initialization methods are called. |
| `ERR_UPDATES_CHECK`    | An unexpected error occurred when trying to check for new updates. Check the error message for more information.                                                                                                                                              |
| `ERR_UPDATES_FETCH`    | An unexpected error occurred when trying to fetch a new update. Check the error message for more information.                                                                                                                                                 |
