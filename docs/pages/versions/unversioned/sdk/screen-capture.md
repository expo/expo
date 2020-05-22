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

export default function KeepAwakeExample {
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
import { preventScreenCapture, allowScreenCapture } from 'expo-screen-capture';
import React from 'react';
import { Button, View } from 'react-native';

export default class KeepAwakeExample extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Button onPress={this._activate}>Activate</Button>
        <Button onPress={this._deactivate}>Deactivate</Button>
      </View>
    );
  }

  _activate = () => {
    /* @info Screen will be uncapturable once <strong>preventScreenCapture()</strong> is called. */
    preventScreenCapture();
    /* @end */
  };

  _deactivate = () => {
    /* @info Deactivates preventing screen capture, or does nothing if it was never activated. */
    allowScreenCapture();
    /* @end */
  };
}
```

## API

```js
import KeepAwake from 'expo-screen-capture';
```

<TableOfContentSection title='Methods' contents={['usePreventScreenCapture()', 'preventScreenCapture()', 'allowScreenCapture()']} />

## Methods

### `usePreventScreenCapture()`

A React hook to prevent screen capturing for as long as the owner component is mounted.

### `preventScreenCapture()`

Prevents screenshots and screen recordings until `allowScreenCapture` is called. If you are already preventing screen capture, this method does nothing.

Please note that on iOS, this will only prevent screen recordings, and is only available on iOS 11 and newer. On older iOS versions, this method does nothing.

### `allowScreenCapture()`

Re-allows the user to screen record or screenshot your app. If you haven't called `preventScreenCapture()` yet, this method does nothing
