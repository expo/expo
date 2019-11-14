---
title: Haptics
---

Provides haptic feedback for

- iOS 10+ devices using the Taptic Engine
- Android devices using Vibrator system service.

On iOS, _the Taptic engine will do nothing if any of the following conditions are true on a user's device:_

- Low Power Mode is enabled ([Feature Request](https://expo.canny.io/feature-requests/p/expose-low-power-mode-ios-battery-saver-android))
- User disabled the Taptic Engine in settings ([Feature Request](https://expo.canny.io/feature-requests/p/react-native-settings))
- Haptic engine generation is too low (less than 2nd gen) - Private API
  - Using private API will get your app rejected: `[[UIDevice currentDevice] valueForKey: @"_feedbackSupportLevel"]` so this is not added in Expo
- iOS version is less than 10 (iPhone 7 is the first phone to support this)
  - This could be found through: `Constants.platform.ios.systemVersion` or `Constants.platform.ios.platform`

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-haptics`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-haptics).

> **Note**: Not compatible with web.

## API

```js
import * as Haptics from 'expo-haptics';
```

### `Haptics.selectionAsync()`

Used to let a user know when a selection change has been registered

#### Returns

A `Promise` resolving once native size haptics functionality is triggered.

### `Haptics.notificationAsync(type)`

The kind of notification response used in the feedback

#### Arguments

- **type: `NotificationFeedbackType`** -- A notification feedback type that on `iOS` is directly mapped to [UINotificationFeedbackType](https://developer.apple.com/documentation/uikit/uinotificationfeedbacktype), while on `Android` these are simulated using [Vibrator](https://developer.android.com/reference/android/os/Vibrator). You can use one of `Haptics.NotificationFeedbackType.{Success, Warning, Error}`.

#### Returns

A `Promise` resolving once native size haptics functionality is triggered.

### `Haptics.impactAsync(style)`

#### Arguments

- **style: `ImpactFeedbackStyle`** -- A collision indicator that on `iOS` is directly mapped to [UIImpactFeedbackStyle](https://developer.apple.com/documentation/uikit/uiimpactfeedbackstyle), while on `Android` these are simulated using [Vibrator](https://developer.android.com/reference/android/os/Vibrator). You can use one of `Haptics.ImpactFeedbackStyle.{Light, Medium, Heavy}`.

#### Returns

A `Promise` resolving once native size haptics functionality is triggered.
