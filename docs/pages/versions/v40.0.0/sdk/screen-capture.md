---
title: ScreenCapture
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-40/packages/expo-screen-capture'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

**`expo-screen-capture`** allows you to protect screens in your app from being captured or recorded, as well as be notified if a screenshot is taken while your app is foregrounded. The two most common reasons you may want to prevent screen capture are:

- If a screen is displaying sensitive information (password, credit card data, etc.)
- You are displaying paid content that you don't want recorded and shared

This is especially important on Android, since the [`android.media.projection`](https://developer.android.com/about/versions/android-5.0.html#ScreenCapture) API allows third-party apps to perform screen capture or screen sharing (even if the app is backgrounded).

> Currently, taking screenshots on iOS cannot be prevented. This is due to underlying OS limitations.

<PlatformsSection android emulator ios simulator />

## Installation

<InstallSection packageName="expo-screen-capture" />

## Usage

### Example: hook

<SnackInline label="Screen Capture hook" dependencies={["expo-screen-capture"]}>

```javascript
import { usePreventScreenCapture } from 'expo-screen-capture';
import React from 'react';
import { Text, View } from 'react-native';

export default function ScreenCaptureExample() {
  usePreventScreenCapture();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>As long as this component is mounted, this screen is unrecordable!</Text>
    </View>
  );
}
```

</SnackInline>

### Example: functions

<SnackInline label="Screen Capture functions" dependencies={["expo-screen-capture", "expo-permissions"]}>

```js
import * as ScreenCapture from 'expo-screen-capture';
import * as Permissions from 'expo-permissions';
import React from 'react';
import { Button, View, Platform } from 'react-native';

export default class ScreenCaptureExample extends React.Component {
  async componentDidMount() {
    // This permission is only required on Android
    const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    if (status === 'granted') {
      ScreenCapture.addScreenshotListener(() => {
        alert('Thanks for screenshotting my beautiful app 😊');
      });
    }
  }

  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-around' }}>
        <Button title="Activate" onPress={this._activate} />
        <Button title="Deactivate" onPress={this._deactivate} />
      </View>
    );
  }

  _activate = async () => {
    await ScreenCapture.preventScreenCaptureAsync();
  };

  _deactivate = async () => {
    await ScreenCapture.allowScreenCaptureAsync();
  };
}
```

</SnackInline>

## API

```js
import * as ScreenCapture from 'expo-screen-capture';
```

## Methods

### `usePreventScreenCapture(key)`

A React hook to prevent screen capturing for as long as the owner component is mounted.

#### Arguments

- **key (string)** [Optional] If provided, this will prevent multiple instances of this hook or the `preventScreenCaptureAsync` and `allowScreenCaptureAsync` methods from conflicting with each other. This argument is useful if you have multiple active components using the `allowScreenCaptureAsync` hook. Defaults to `default`.

### `preventScreenCaptureAsync(key)`

Prevents screenshots and screen recordings until `allowScreenCaptureAsync` is called. If you are already preventing screen capture, this method does nothing (unless you pass a new and unique `key`).

Please note that on iOS, this will only prevent screen recordings, and is only available on iOS 11 and newer. On older iOS versions, this method does nothing.

#### Arguments

- **key (string)** [Optional] If provided, this will help prevent multiple instances of the `preventScreenCaptureAsync` and `allowScreenCaptureAsync` methods (and `usePreventScreenCapture` hook) from conflicting with each other. When using multiple keys, you'll have to re-allow each one in order to re-enable screen capturing. Defaults to `default`.

### `allowScreenCaptureAsync(key)`

Re-allows the user to screen record or screenshot your app. If you haven't called `preventScreenCaptureAsync()` yet, this method does nothing

#### Arguments

- **key (string)** [Optional] The value must be the same as the `key` passed to `preventScreenCaptureAsync` in order to re-enable screen capturing.

### `addScreenshotListener(listener)`

Adds a listener that will fire whenever the user takes a screenshot while the app is foregrounded. On Android, this method requires the `READ_EXTERNAL_STORAGE` permission- you can request this with [`Permissions.askAsync(Permissions.MEDIA_LIBRARY)`](permissions.md#permissionsmedia_library).

#### Arguments

- **listener (function)** The function that will be executed when the user takes a screenshot. This function accepts no arguments.

#### Returns

A `Subscription` object that you can use to unregister the listener, either by calling `.remove()` or passing it to `removeScreenshotListener`.

### `removeScreenshotListener(subscription)`

Removes the subscription you provide, so that you are no longer listening for screen shots.

#### Arguments

- **subscription (Subscription)** `Subscription` returned by `addScreenshotListener`. If you prefer, you can also call `.remove` on that `Subscription` object, e.g.

```js
let mySubscription = addScreenshotListener(() => {
  console.log("You took a screenshot!");
})
...
mySubscription.remove();
// OR
removeScreenshotListener(mySubscription);
```
