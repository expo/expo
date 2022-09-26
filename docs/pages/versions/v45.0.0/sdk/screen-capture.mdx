---
title: ScreenCapture
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-45/packages/expo-screen-capture'
packageName: 'expo-screen-capture'
---

import APISection from '~/components/plugins/APISection';
import {APIInstallSection} from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

**`expo-screen-capture`** allows you to protect screens in your app from being captured or recorded, as well as be notified if a screenshot is taken while your app is foregrounded. The two most common reasons you may want to prevent screen capture are:

- If a screen is displaying sensitive information (password, credit card data, etc.)
- You are displaying paid content that you don't want recorded and shared

This is especially important on Android, since the [`android.media.projection`](https://developer.android.com/about/versions/android-5.0.html#ScreenCapture) API allows third-party apps to perform screen capture or screen sharing (even if the app is backgrounded).

> Currently, taking screenshots on iOS cannot be prevented. This is due to underlying OS limitations.

<PlatformsSection android emulator ios simulator />

## Installation

<APIInstallSection />

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

<SnackInline label="Screen Capture functions" dependencies={["expo-screen-capture", "expo-media-library"]}>

```js
import React from 'react';
import { Button, View, Platform } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import * as MediaLibrary from 'expo-media-library';

export default class ScreenCaptureExample extends React.Component {
  async componentDidMount() {
    // This permission is only required on Android
    const { status } = await MediaLibrary.requestPermissionsAsync();
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

<APISection packageName="expo-screen-capture" apiName="ScreenCapture" />