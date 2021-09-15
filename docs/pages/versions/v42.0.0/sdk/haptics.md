---
title: Haptics
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-42/packages/expo-haptics'
---

import APISection from '~/components/plugins/APISection';
import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`expo-haptics`** provides haptic (touch) feedback for

- iOS 10+ devices using the Taptic Engine
- Android devices using Vibrator system service.

On iOS, _the Taptic engine will do nothing if any of the following conditions are true on a user's device:_

- Low Power Mode is enabled ([Feature Request](https://expo.canny.io/feature-requests/p/expose-low-power-mode-ios-battery-saver-android))
- User disabled the Taptic Engine in settings ([Feature Request](https://expo.canny.io/feature-requests/p/react-native-settings))
- Haptic engine generation is too low (less than 2nd gen) - Private API
  - Using private API will get your app rejected: `[[UIDevice currentDevice] valueForKey: @"_feedbackSupportLevel"]` so this is not added in Expo
- iOS version is less than 10 (iPhone 7 is the first phone to support this)
  - This could be found through: `Constants.platform.ios.systemVersion` or `Constants.platform.ios.platform`

<PlatformsSection android emulator ios simulator />

## Installation

<InstallSection packageName="expo-haptics" />

## Configuration

On Android, this module requires permission to control vibration on the device. The `VIBRATE` permission is added automatically.

## API

```js
import * as Haptics from 'expo-haptics';
```

<APISection packageName="expo-haptics" apiName="Haptics" />