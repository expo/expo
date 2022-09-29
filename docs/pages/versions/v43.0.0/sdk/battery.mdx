---
title: Battery
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-43/packages/expo-battery'
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
import * as React from 'react';
import * as Battery from 'expo-battery';
import { StyleSheet, Text, View } from 'react-native';

export default class App extends React.Component {
  state = {
    batteryLevel: null,
  };

  componentDidMount() {
    this._subscribe();
  }

  componentWillUnmount() {
    this._unsubscribe();
  }

  async _subscribe() {
    const batteryLevel = await Battery.getBatteryLevelAsync();
    this.setState({ batteryLevel });
    this._subscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      this.setState({ batteryLevel });
      console.log('batteryLevel changed!', batteryLevel);
    });
  }

  _unsubscribe() {
    this._subscription && this._subscription.remove();
    this._subscription = null;
  }

  render() {
    return (
      <View style={styles.container}>
        <Text>Current Battery Level: {this.state.batteryLevel}</Text>
      </View>
    );
  }
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
/* @end */
```

</SnackInline>

## API

```js
import * as Battery from 'expo-battery';
```

<APISection packageName="expo-battery" />