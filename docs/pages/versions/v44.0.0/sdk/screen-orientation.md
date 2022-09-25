---
title: ScreenOrientation
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-44/packages/expo-screen-orientation'
---

import { palette } from '@expo/styleguide';
import APISection from '~/components/plugins/APISection'
import ImageSpotlight from '~/components/plugins/ImageSpotlight'
import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

Screen Orientation is defined as the orientation in which graphics are painted on the device. For example, the figure below has a device in a vertical and horizontal physical orientation, but a portrait screen orientation. For physical device orientation, see the orientation section of [Device Motion](devicemotion.md).

<ImageSpotlight alt="Portrait orientation in different physical orientations" src="/static/images/screen-orientation-portrait.png" containerStyle={{ backgroundColor: palette.light.gray['300'] }}  />

`ScreenOrientation` from **`expo`** allows changing supported screen orientations at runtime, and subscribing to orientation changes. This will take priority over the `orientation` key in **app.json**.

On both iOS and Android platforms, changes to the screen orientation will override any system settings or user preferences. On Android, it is possible to change the screen orientation while taking the user's preferred orientation into account. On iOS, user and system settings are not accessible by the application and any changes to the screen orientation will override existing settings.

> Web support has [limited support](https://caniuse.com/#feat=deviceorientation). For improved resize detection on mobile Safari, check out the docs on using [Resize Observer in Expo web](../../../guides/customizing-webpack.md#resizeobserver).

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="expo-screen-orientation" />

### Warning

Apple added support for _split view_ mode to iPads in iOS 9. This changed how the screen orientation is handled by the system. To put the matter shortly, for the iOS, your iPad is always in the landscape mode unless you open two applications side by side. In order to be able to lock screen orientation using this module you will need to disable support for this feature. For more information about the _split view_ mode, check out [the official Apple documentation](https://support.apple.com/en-us/HT207582).

#### Managed workflow

Open your **app.json** and add the following inside of the `"expo"` field:

```json
{
  "expo": {
    ...
    "ios": {
      ...
      "requireFullScreen": true,
    }
  }
}
```

#### Bare workflow

Tick the `Requires Full Screen` checkbox in Xcode. It should be located under `Project Target > General > Deployment Info`.

## API

```js
import * as ScreenOrientation from 'expo-screen-orientation';
```

<APISection packageName="expo-screen-orientation" apiName="ScreenOrientation" />

## Error Codes

| Code                                                 | Description                                                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| ERR_SCREEN_ORIENTATION_UNSUPPORTED_ORIENTATION_LOCK  | The platform does not support the [`OrientationLock`](#screenorientationorientationlock) policy. |
| ERR_SCREEN_ORIENTATION_INVALID_ORIENTATION_LOCK      | An invalid [`OrientationLock`](#screenorientationorientationlock) was passed in.                 |
| ERR_SCREEN_ORIENTATION_GET_ORIENTATION_LOCK          | __Android Only.__ An unknown error occurred when trying to get the orientation lock.             |
| ERR_SCREEN_ORIENTATION_GET_PLATFORM_ORIENTATION_LOCK | __Android Only.__ An unknown error occurred when trying to get the platform orientation lock.    |
| ERR_SCREEN_ORIENTATION_MISSING_ACTIVITY              | __Android Only.__ Could not get the current activity.                                            |
