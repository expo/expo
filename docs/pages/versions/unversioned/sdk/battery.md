---
title: Battery
---

This unimodule provides battery information for the physical device, as well as corresponding event listeners.

## Installation

This API is pre-installed in [managed](../../introduction/managed-vs-bare/#managed-workflow) apps. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-battery).

## API

```js
import * as Battery from 'expo-battery';
```

## Methods

### `Battery.getBatteryLevelAsync()`

Get the battery level of the device as a float between 0 and 1.

#### Returns

A `Promise` that resolves to a `float` representing the battery level.

**Examples**

```js
Battery.getBatteryLevelAsync().then(batteryLevel => {
  // 0.759999
});
```

### `Battery.getPowerStateAsync()`

Gets the power state of the device including the battery level, whether it is plugged in, and if the system is currently operating in Low Power Mode (iOS) or Power Saver Mode (Android). Displays a warning on iOS if battery monitoring is not enabled, or if attempted on iOS simulator (where monitoring is not possible)

#### Returns

Returns a promise with an object with the following fields:

- **batteryLevel (_float_)** -- a float between 0 and 1.

- **batteryState (_string_)** -- `unplugged` if unplugged, `charging` if charging, `full` if battery level is full, `unknown` if battery in an unknown state.

- **lowPowerMode (_string_)** -- `on` if lowPowerMode is on, `off` if lowPowerMode is off.

**Examples**

```js
Battery.getPowerStateAsync().then(powerState => {
  // {
  //   batteryLevel: 0.759999,
  //   batteryState: 'unplugged',
  //   lowPowerMode: 'on',
  // }
});
```

### `Battery.getBatteryStateAsync()`

Tells the battery's current state.

- `unplugged` if battery is not charging
- `charging` if battery is charging
- `full` if battery level is full
- `unknown` if the battery state is unknown or unable to access

#### Returns

Returns a `Promise` that resolves to a `string` value for whether the device is any of the four state above.

**Examples**

```js
Battery.getBatteryStateAsync().then(batteryState => {
  // 'charging'
});
```

### `Battery.getLowPowerModeStatusAsync()`

Gets the current status of Low Power mode on iOS and Battery Saver mode on Android. 

#### Returns 

Returns a `Promise` that resolves to a `string` value of either `on` or `off`, indicating whether low power mode is enabled or disabled, respectively. 

**Examples** 

Low Power Mode (iOS) or Battery Saver Mode (Android) are enabled.
```js
Battery.getLowPowerModeStatusAsync().then(lowPowerMode => {
  // 'on'
})
```

### `Battery.watchBatteryLevelChange(callback)`

Subscribe to the battery level change updates.

On iOS devices, the event would be fired when the battery level drops up to 1 percent, but is only fired once per minute at maximum.

On Android devices, the event would be fired only when significant changes happens. When battery level dropped below `"android.intent.action.BATTERY_LOW"` or up to `"android.intent.action.BATTERY_OKAY"` from low battery level. Click [ here ](https://developer.android.com/training/monitoring-device-state/battery-monitoring) to view more explanation on the official docs.

#### Arguments

- **callback (_function_)** A callback that is invoked when battery level changes. The callback is provided a single argument that is an object with a `batteryLevel` key.

#### Returns

- An `EventSubscription` object that you can call `remove()` on when you would like to unsubscribe from the listener.

### `Battery.watchBatteryStateChange(callback)`

Subscribe to the battery state change updates. One of the four possible battery state values, `unplugged`, `full`, `unknown`, or `charging`, will be returned.

#### Arguments

- **callback (_function_)** A callback that is invoked when battery state changes. The callback is provided a single argument that is an object with a `batteryState` key.

#### Returns

- An `EventSubscription` object that you can call `remove()` on when you would like to unsubscribe the listener.

### `Battery.watchPowerModeChange(callback)`

Subscribe to Low Power Mode (iOS) or Battery Saver Mode (Android) updates. The event fired whenever the power mode is toggled.

#### Arguments

- **callback (_function_)** A callback that is invoked when Low Power Mode (iOS) or Battery Saver Mode (Android) changes. The callback is provided a single argument that is an object with a `lowPowerMode` key.

#### Returns

- An `EventSubscription` object that you can call `remove()` on when you would like to unsubscribe the listener.

**Examples**

```js
import Expo from 'expo';
import React from 'react';
import * as Battery from 'expo-battery';
import { StyleSheet, Text, View } from 'react-native';

export default class App extends React.Component {
  state = {
    batteryLevel: null,
  };

  componentDidMount() {
    try {
      let batteryLevel = await Battery.getBatteryLevelAsync();
      this.setState({ batteryLevel });
    } catch (e) {
      console.log('Trouble getting battery info', e);
    }
    this._subscribe();
  }

  componentWillUnmount() {
    this._unsubscribe();
  }

  _subscribe = () => {
    this._subscription = Battery.watchBatteryLevelChange({ batteryLevel }) => {
      this.setState({ batteryLevel });
      console.log('batteryLevel changed!', batteryLevel);
    });
  };

  _unsubscribe = () => {
    this._subscription && this._subscription.remove();
    this._subscription = null;
  };

  render() {
    return (
      <View style={styles.container}>
        <Text>Current Battery Level: {this.state.batteryLevel}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```
