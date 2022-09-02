---
title: ScreenOrientation
sourceCodeUrl: 'https://github.com/expo/expo/tree/main/packages/expo-screen-orientation'
packageName: 'expo-screen-orientation'
---

import { ConfigReactNative, ConfigPluginExample, ConfigPluginProperties } from '~/components/plugins/ConfigSection';
import { palette } from '@expo/styleguide';
import APISection from '~/components/plugins/APISection'
import ImageSpotlight from '~/components/plugins/ImageSpotlight'
import {APIInstallSection} from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

Screen Orientation is defined as the orientation in which graphics are painted on the device. For example, the figure below has a device in a vertical and horizontal physical orientation, but a portrait screen orientation. For physical device orientation, see the orientation section of [Device Motion](devicemotion.md).

<ImageSpotlight alt="Portrait orientation in different physical orientations" src="/static/images/screen-orientation-portrait.png" containerStyle={{ backgroundColor: palette.light.gray['300'] }} />

On both iOS and Android platforms, changes to the screen orientation will override any system settings or user preferences. On Android, it is possible to change the screen orientation while taking the user's preferred orientation into account. On iOS, user and system settings are not accessible by the application and any changes to the screen orientation will override existing settings.

> Web support has [limited support](https://caniuse.com/#feat=deviceorientation). For improved resize detection on mobile Safari, check out the docs on using [Resize Observer in Expo web](/guides/customizing-webpack.md#resizeobserver).

<PlatformsSection android emulator ios simulator web />

## Installation

<APIInstallSection />

### Warning

Apple added support for _split view_ mode to iPads in iOS 9. This changed how the screen orientation is handled by the system. To put the matter shortly, for the iOS, your iPad is always in the landscape mode unless you open two applications side by side. In order to be able to lock screen orientation using this module you will need to disable support for this feature. For more information about the _split view_ mode, check out [the official Apple documentation](https://support.apple.com/en-us/HT207582).

## Configuration in app.json / app.config.js

You can configure `expo-screen-orientation` using its built-in [config plugin](/guides/config-plugins) if you use config plugins in your project ([EAS Build](/build/introduction) or `npx expo run:[android|ios]`). The plugin allows you to configure various properties that cannot be set at runtime and require building a new app binary to take effect.

<ConfigReactNative>

1. Open the `ios/` directory in Xcode with `xed ios`. If you don't have an `ios/` directory, run `npx expo prebuild -p ios` to generate one.
2. Tick the `Requires Full Screen` checkbox in Xcode. It should be located under `Project Target > General > Deployment Info`.

</ConfigReactNative>

<ConfigPluginExample>

```json
{
  "expo": {
    "ios": {
      "requireFullScreen": true
    },
    "plugins": [
      [
        "expo-screen-orientation",
        {
          "initialOrientation": "DEFAULT"
        }
      ]
    ]
  }
}
```

</ConfigPluginExample>

<ConfigPluginProperties properties={[
{ name: 'initialOrientation', platform: 'ios', description: 'Sets the iOS initial screen orientation. Options: `DEFAULT`, `ALL`, `PORTRAIT`, `PORTRAIT_UP`, `PORTRAIT_DOWN`, `LANDSCAPE`, `LANDSCAPE_LEFT`, `LANDSCAPE_RIGHT`', default: 'undefined' },
]} />

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
| ERR_SCREEN_ORIENTATION_GET_ORIENTATION_LOCK          | **Android Only.** An unknown error occurred when trying to get the orientation lock.             |
| ERR_SCREEN_ORIENTATION_GET_PLATFORM_ORIENTATION_LOCK | **Android Only.** An unknown error occurred when trying to get the platform orientation lock.    |
| ERR_SCREEN_ORIENTATION_MISSING_ACTIVITY              | **Android Only.** Could not get the current activity.                                            |
