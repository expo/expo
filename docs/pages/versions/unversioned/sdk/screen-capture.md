---
title: ScreenCapture
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-38/packages/expo-screen-capture'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import TableOfContentSection from '~/components/plugins/TableOfContentSection';

**`expo-screen-capture`** allows you to protect screens in your app from being captured or recorded. The two most common reasons you may want to prevent screen capture are:

- If a screen is displaying sensitive information (password, credit card data, etc.)
- You are displaying paid content that you don't want recorded and shared

This is especially important on Android, since the [`android.media.projection`](https://developer.android.com/about/versions/android-5.0.html#ScreenCapture) API allows third-party apps to perform screen capture or screen sharing (even if the app is backgrounded).

> Currently, taking screenshots on iOS cannot be prevented. This is due to underlying OS limitations.

<PlatformsSection android emulator ios simulator />

## Installation

<InstallSection packageName="expo-screen-capture" />

## Usage

### Example: hook

```javascript
import { usePreventScreenCapture } from 'expo-screen-capture';
import React from 'react';
import { Text, View } from 'react-native';

export default function ScreenCaptureExample {
  /* @info As long as this component is mounted, the screen cannot captured */
  usePreventScreenCapture();
  /* @end */
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>This is an unrecordable screen!</Text>
    </View>
  );
}
```

### Example: functions

```javascript
import { preventScreenCaptureAsync, allowScreenCaptureAsync } from 'expo-screen-capture';
import React from 'react';
import { Button, View } from 'react-native';

export default class ScreenCaptureExample extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Button onPress={this._activate}>Activate</Button>
        <Button onPress={this._deactivate}>Deactivate</Button>
      </View>
    );
  }

  _activate = () => {
    /* @info Screen will be uncapturable once <strong>preventScreenCaptureAsync()</strong> is called. */
    preventScreenCaptureAsync(); /* @end */

  };

  _deactivate = () => {
    /* @info Re-allows screen capture, or does nothing if preventScreenCaptureAsync() was never called. */
    allowScreenCaptureAsync(); /* @end */

  };
}
```

## API

```js
import {
  usePreventScreenCapture,
  preventScreenCaptureAsync,
  allowScreenCaptureAsync
} from 'expo-screen-capture';
```

<TableOfContentSection title='Methods' contents={['usePreventScreenCapture()', 'preventScreenCaptureAsync()', 'allowScreenCaptureAsync()']} />

## Methods

### `usePreventScreenCapture(key?: String)`

A React hook to prevent screen capturing for as long as the owner component is mounted.

#### Arguments

- **key (string)** [Optional] If provided, this will prevent multiple instances of this hook or the `preventScreenCaptureAsync` and `allowScreenCaptureAsync` methods from conflicting with each other. This argument is useful if you have multiple active components using the `allowScreenCaptureAsync` hook. Defaults to `default`.

### `preventScreenCaptureAsync(key?: String)`

Prevents screenshots and screen recordings until `allowScreenCaptureAsync` is called. If you are already preventing screen capture, this method does nothing (unless you pass a new and unique `key`).

Please note that on iOS, this will only prevent screen recordings, and is only available on iOS 11 and newer. On older iOS versions, this method does nothing.

#### Arguments

- **key (string)** [Optional] If provided, this will help prevent multiple instances of the `preventScreenCaptureAsync` and `allowScreenCaptureAsync` methods (and `usePreventScreenCapture` hook) from conflicting with each other. When using multiple keys, you'll have to re-allow each one in order to re-enable screen capturing. Defaults to `default`.

### `allowScreenCaptureAsync(key?: String)`

Re-allows the user to screen record or screenshot your app. If you haven't called `preventScreenCaptureAsync()` yet, this method does nothing

#### Arguments

- **key (string)** [Optional] The value must be the same as the `key` passed to `preventScreenCaptureAsync` in order to re-enable screen capturing.
