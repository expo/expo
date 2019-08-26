---
title: Battery
---

Provides battery information for the physical device, as well as corresponding event listeners.

## Installation

This API is pre-installed in [managed](../../introduction/managed-vs-bare/#managed-workflow) apps. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-battery).

## API

```js
import * as Battery from 'expo-battery';
```

Note: On iOS simulator, battery monitoring is not possible.

### Methods

- [`Battery.getBatteryLevelAsync()`](#batterygetbatterylevelasync)
- [`Battery.getBatteryStateAsync()`](#batterygetbatterystateasync)
- [`Battery.isLowPowerModeEnabledAsync()`](#batteryislowpowermodeenabledasync)
- [`Battery.getPowerStateAsync()`](#batterygetpowerstateasync)

### Event Subscriptions

- [`Battery.addBatteryLevelListener(callback)`](#batteryaddbatterylevellistenercallback)
- [`Battery.addBatteryStateListener(callback)`](#batteryaddbatterystatelistenercallback)
- [`Battery.addLowPowerModeListener(callback)`](#batteryaddlowpowermodelistenercallback)

### Enum Types

- [`Battery.BatteryState`](#batterybatterystate)

### Errors

- [Error Codes](#error-codes)

## Methods

### `Battery.getBatteryLevelAsync()`

Gets the battery level of the device as a number between 0 and 1.

On Android, the default value is `-1`. If the current battery level cannot be retrieved, this throws `NullPointerException` with error code [`ERR_BATTERY_INVALID_ACCESS_BATTERY_LEVEL`](#error-codes).

#### Returns

A `Promise` that resolves to a `number` representing the battery level.

**Examples**

```js
await Battery.getBatteryLevelAsync();
// 0.759999
```

### `Battery.getBatteryStateAsync()`

Tells the battery's current state.

#### Returns

Returns a `Promise` that resolves to a [`Battery.BatteryState`](#batterybatterystate) enum value for whether the device is any of the four states.

**Examples**

```js
await Battery.getBatteryStateAsync();
// BatteryState.CHARGING
```

### `Battery.isLowPowerModeEnabledAsync()`

Gets the current status of Low Power mode on iOS and Power Saver mode on Android.

#### Returns

Returns a `Promise` that resolves to a `boolean` value of either `true` or `false`, indicating whether low power mode is enabled or disabled, respectively.

**Examples**

Low Power Mode (iOS) or Power Saver Mode (Android) are enabled.

```js
await Battery.isLowPowerModeEnabledAsync();
// true
```

### `Battery.getPowerStateAsync()`

Gets the power state of the device including the battery level, whether it is plugged in, and if the system is currently operating in Low Power Mode (iOS) or Power Saver Mode (Android). 

#### Returns

Returns a promise with an object with the following fields:

- **batteryLevel (_float_)** -- a float between 0 and 1.

- **batteryState (_BatteryState_)** -- a [`Battery.BatteryState`](#batterybatterystate) enum value.

- **lowPowerMode (_boolean_)** -- `true` if lowPowerMode is on, `false` if lowPowerMode is off.

**Examples**

```js
await Battery.getPowerStateAsync();
// {
//   batteryLevel: 0.759999,
//   batteryState: BatteryState.UNPLUGGED,
//   lowPowerMode: true,
// }
```

## Event Subscriptions

### `Battery.addBatteryLevelListener(callback)`

Subscribe to the battery level change updates.

On iOS devices, the event would be fired when the battery level drops 1 percent or more, but is only fired once per minute at maximum.

On Android devices, the event would be fired only when significant changes happens. When battery level dropped below [`"android.intent.action.BATTERY_LOW"`](https://developer.android.com/reference/android/content/Intent#ACTION_BATTERY_LOW) or up to [`"android.intent.action.BATTERY_OKAY"`](https://developer.android.com/reference/android/content/Intent#ACTION_BATTERY_OKAY) from low battery level. See [here](https://developer.android.com/training/monitoring-device-state/battery-monitoring) to view more explanation on the official docs.

#### Arguments

- **callback (_function_)** A callback that is invoked when battery level changes. The callback is provided a single argument that is an object with a `batteryLevel` key.

#### Returns

- An `EventSubscription` object that you can call `remove()` on when you would like to unsubscribe from the listener.

### `Battery.addBatteryStateListener(callback)`

Subscribe to the battery state change updates. Returns a [`Battery.BatteryState`](#batterybatterystate) enum value for whether the device is any of the four states.

#### Arguments

- **callback (_function_)** A callback that is invoked when battery state changes. The callback is provided a single argument that is an object with a `batteryState` key.

#### Returns

- An `EventSubscription` object that you can call `remove()` on when you would like to unsubscribe the listener.

### `Battery.addLowPowerModeListener(callback)`

Subscribe to Low Power Mode (iOS) or Power Saver Mode (Android) updates. The event fired whenever the power mode is toggled.

#### Arguments

- **callback (_function_)** A callback that is invoked when Low Power Mode (iOS) or Power Saver Mode (Android) changes. The callback is provided a single argument that is an object with a `lowPowerMode` key.

#### Returns

- An `EventSubscription` object that you can call `remove()` on when you would like to unsubscribe the listener.

## Enum types

### `Battery.BatteryState`

- **`BatteryState.UNKNOWN`** - if the battery state is unknown or unable to access.
- **`BatteryState.UNPLUGGED`** - if battery is not charging or discharging.
- **`BatteryState.CHARGING`** - if battery is charging.
- **`BatteryState.FULL`** - if the battery level is full.

## Error Codes

| Code                                     | Description                                                                                                                       |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| ERR_BATTERY_INVALID_ACCESS_BATTERY_LEVEL | Unable to access battery level.                                                                                                   |
| ERR_BATTERY_INVALID_ACCESS_BATTERY_STATE | Unable to access battery state.                                                                                                   |
| ERR_BATTERY_INVALID_ACCESS_POWER_SAVER   | Unable to access Low Power Mode(iOS) or Power Saver(Android).                                                                     |
| ERR_BATTERY_INVALID_ACCESS_POWER_STATE   | Unable to access power state. Any invalid access from the three states above in `getPowerStateAsync` would throw this error code. |

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
    this._subscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
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
