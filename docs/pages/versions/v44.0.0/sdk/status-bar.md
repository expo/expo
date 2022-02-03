---
id: statusbar
title: StatusBar
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-44/packages/expo-status-bar'
---

import APISection from '~/components/plugins/APISection';
import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

**`expo-status-bar`** gives you a component and imperative interface to control the app status bar to change its text color, background color, hide it, make it translucent or opaque, and apply animations to any of these changes. Exactly what you are able to do with the `StatusBar` component depends on the platform you're using.

<PlatformsSection android emulator ios simulator web />

> **Web support**
> 
> There is no API available on the web for controlling the operating system status bar, so `expo-status-bar` will noop, so it will do nothing, it will also **not** error.

## Installation

<InstallSection packageName="expo-status-bar" />

## Usage

<SnackInline dependencies={["expo-status-bar"]}>

```js
import React from 'react';
import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const App = () => (
  <View
    style={{
      flex: 1,
      backgroundColor: '#000',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
    <Text style={{ color: '#fff' }}>
      Notice that the status bar has light text!
    </Text>
    <StatusBar style="light" />
  </View>
);

export default App;
```

</SnackInline>

## API

```js
import { StatusBar } from 'expo-status-bar';
```

<APISection packageName="expo-status-bar" apiName="StatusBar" />
