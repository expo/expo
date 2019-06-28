---
title: Battery
---

Provide battery information for the physical device.

## Installation

This API is pre-installed in [managed](../../introduction/managed-vs-bare/#managed-workflow) apps. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-battery).

## API

```js
import * as Battery from 'expo-battery';
```

## Methods

### `Device.getBatteryLevelAsync()`

Get the battery level of the device as a float between 0 and 1.

#### Returns

A Promise that resolves to a float representing the battery level.

**Examples**

```js
Device.getBatteryLevelAsync().then(batteryLevel => {
  // 0.759999
});
```

### `Device.getPowerStateAsync()`

Gets the power state of the device including the battery level, whether it is plugged in, and if the system is currently operating in low power mode (power saver in Android). Displays a warning on iOS if battery monitoring not enabled, or if attempted on an emulator (where monitoring is not possible)

#### Returns

Returns a promise with an object with the following fields:

- **batteryLevel (_float_)** -- a float between 0 and 1.

- **batteryState (_string_)** -- `unplugged` if unplugged, `charging` if charging, `full` if battery level is full, `unknown` if battery in an unknown state.

- **lowPowerMode (_string_)** -- `true` if lowPowerMode is on, `false` if lowPowerMode is off.

**Examples**

```js
Device.getPowerStateAsync().then(state => {
  // {
  //   batteryLevel: 0.759999,
  //   batteryState: 'unplugged',
  //   lowPowerMode: false,
  // }
});
```

### `Device.getBatteryStateAsync()`

Tells the battery's current state.

- `unplugged` if battery is not charging
- `charging` if battery is charging
- `full` if battery level is full
- `unkown` if the battery state is unknown or unable to access

#### Returns

Returns a promise that resolves the `string` value for whether the device is any of the four state above.

**Examples**

```js
Device.isBatteryChargingAsync().then(isCharging => {
  // 'charging'
});
```

### `Device.watchBatteryLevelChange(callback)`

Subscribe to the battery level change updates.

On iOS devices, the event would be fired when the battery level drop up to 1 percent, but once per minute at maximum.

On Android devices, the event would be fired only when significant changes happens. When battery level dropped below `"android.intent.action.BATTERY_LOW"` or up to `"android.intent.action.BATTERY_OKAY"` from low battery level. Click [ here ](https://developer.android.com/training/monitoring-device-state/battery-monitoring) to view more explanation on the official docs.

#### Arguments

- **callback (_function_)** A callback that is invoked when battery level changes. The callback is provided a single argument that is an object with a `batteryLevel` key.

#### Returns

- An EventSubscription object that you can call remove() on when you would like to unsubscribe the listener.

### `Device.watchBatteryStateChange(callback)`

Subscribe to the battery state change updates. One of the four, `unplugged`, `full`, `unkown`, `charging` battery state will be returned.

#### Arguments

- **callback (_function_)** A callback that is invoked when battery state changes. The callback is provided a single argument that is an object with a `batteryState` key.

#### Returns

- An EventSubscription object that you can call remove() on when you would like to unsubscribe the listener.

### `Device.watchPowerModeChange(callback)`

Subscribe to the low power mode ( power saver ) updates.

#### Arguments

- **callback (_function_)** A callback that is invoked when battery state changes. The callback is provided a single argument that is an object with a `isLowPowerMode` key.

#### Returns

- An EventSubscription object that you can call remove() on when you would like to unsubscribe the listener.

**Examples**

```js
import Expo from "expo";
import React from "react";
import * as Battery from "expo-battery";
import { StyleSheet, Text, View } from "react-native";

export default class App extends React.Component {
  state = {
    batteryLevel: null
  };

  componentDidMount() {
    this._subscribe();
  }

  componentWillUnmount() {
    this._unsubscribe();
  }

  _subscribe = () => {
    this._subscription = Battery.watchBatteryLevelChange(result => {
      this.setState({
        batteryLevel: result.batteryLevel
      });
    });
    Battery.getBatteryLevelAsync()
    .then(level => {
      this.setState({
        batteryLevel: level
      })
    })
  }

  _unsubscribe = () => {
    this._subscription && this._subscription.remove();
    this._subscription = null;
  };

  render() {
    return (
      <View style={styles.container}>
        <Text>
          Current Battery Level: {this.state.batteryLevel}
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 15,
    alignItems: "center",
    justifyContent: "center"
  }
});
```