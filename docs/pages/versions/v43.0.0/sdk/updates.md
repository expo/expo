---
title: Updates
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-43/packages/expo/src/Updates'
---

import APISection from '~/components/plugins/APISection';
import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

The `expo-updates` library by Expo allows you to programmatically control and respond to new updates made available to your app.

<PlatformsSection android emulator ios simulator />

## Installation

<InstallSection packageName="expo-updates" />

Since extra setup is required to use this module in bare React Native apps, for easiest use we recommend using a template project with `expo-updates` already installed. You can use `expo init --template=expo-template-bare-minimum` to initialize a new project from such a template.

> Most of the methods and constants in this module can only be used or tested in release mode; they do not make sense in debug builds where you always load the latest JS from your computer while developing. To test manual updates in the Expo Go app, run `expo publish` and then open the published version of your app with Expo Go. To test manual updates in Bare workflow apps, make a release build with `npm run ios --configuration Release` or `npm run android --variant Release` (you don't need to submit this build to the App/Play Store to test).

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
