---
title: PreventScreenShot
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-38/packages/expo-prevent-screen-shot'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import TableOfContentSection from '~/components/plugins/TableOfContentSection';

**`expo-prevent-screen-capture`** provides a React hook that prevents users from screen recording your app, and from taking screen shots of your app.

> Screen shot prevention is currently Android-only, due to underlying iOS limitations.

<PlatformsSection android emulator ios simulator />

## Installation

<InstallSection packageName="expo-prevent-screen-capture" />

## Usage

### Example: hook

```javascript
import { usePreventScreenCapture } from 'expo-prevent-screen-capture';
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
import {
  activatePreventScreenCapture,
  deactivatePreventScreenCapture,
} from 'expo-prevent-screen-capture';
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
    /* @info Screen will be uncapturable once <strong>activatePreventScreenCapture()</strong> is called. */
    activatePreventScreenCapture();
    /* @end */
  };

  _deactivate = () => {
    /* @info Deactivates preventing screen capture, or does nothing if it was never activated. */
    deactivatePreventScreenCapture();
    /* @end */
  };
}
```

## API

```js
import KeepAwake from 'expo-prevent-screen-capture';
```

<TableOfContentSection title='Methods' contents={['usePreventScreenCapture()', 'activatePreventScreenCapture()', 'deactivatePreventScreenCapture()']} />

## Methods

### `usePreventScreenCapture()`

A React hook to prevent screen capturing for as long as the owner component is mounted.

### `activatePreventScreenCapture()`

Prevents screenshots (on Android) and screen recordings until `deactivatePreventScreenCapture` is called.

### `deactivatePreventScreenCapture()`

Re-allows the user to screen record or screenshot your app.
