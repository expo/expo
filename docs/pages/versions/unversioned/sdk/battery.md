---
title: Battery
sourceCodeUrl: 'https://github.com/expo/expo/tree/master/packages/expo-battery'
---

import APISection from '~/components/plugins/APISection';
import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

**`expo-battery`** provides battery information for the physical device (such as battery level, whether or not the device is charging, and more) as well as corresponding event listeners.

<PlatformsSection android emulator ios web />

## Installation

<InstallSection packageName="expo-battery" />

## Usage

<SnackInline label='Basic Battery Usage' dependencies={['expo-battery']}>

```jsx
import React, { useState, useEffect } from 'react';
import * as Battery from 'expo-battery';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  let [batteryLevel, setBatteryLevel] = useState(null);

  useEffect(() => {
    let listener;

    (async () => {
      setBatteryLevel(await Battery.getBatteryLevelAsync());
      function batteryLevelListener({ batteryLevel }) {
        console.log(`Battery level changed to {batteryLevel}`);
        setBatteryLevel(batteryLevel);
      }
      listener = Battery.addBatteryLevelListener(batteryLevelListener);
    })();

    return function cleanup() {
      listener && listener.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text>Current Battery Level: {batteryLevel}</Text>
      <BatteryView level={batteryLevel} />
    </View>
  );
}

/* @hide const styles = StyleSheet.create({ ... }); */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function BatteryView(props, context) {
  return (
    <View
      style={{
        marginTop: 10,
        borderRadius: 4,
        borderStyle: 'solid',
        borderColor: 'black',
        borderWidth: 4,
        width: 100,
        height: 62,
        alignContent: 'flexStart',
        alignItems: 'flexStart',
      }}>
      <View
        style={{
          width: 92 * props.level,
          backgroundColor: '#53d769',
          height: 54,
        }}
      />
    </View>
  );
}
/* @end */
```

</SnackInline>

## API

```js
import * as Battery from 'expo-battery';
```

<APISection packageName="expo-battery" />
