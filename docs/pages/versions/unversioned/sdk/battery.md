---
title: Battery
---

Provides battery information for the physical device, as well as corresponding event listeners.

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-battery`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-battery).

## API

```js
import * as Battery from 'expo-battery';
```

Note: On iOS simulators, battery monitoring is not possible.

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

Gets the battery level of the device as a number between 0 and 1, inclusive. If the device does not support retrieving the battery level, this method returns -1. On web, this method always returns -1.

#### Returns

A `Promise` that resolves to a `number` between 0 and 1 representing the battery level, or -1 if the device does not provide it.

**Examples**

```js
await Battery.getBatteryLevelAsync();
// 0.759999
```

### `Battery.getBatteryStateAsync()`

Tells the battery's current state. On web, this always returns `BatteryState.UNKNOWN`.

#### Returns

Returns a `Promise` that resolves to a [`Battery.BatteryState`](#batterybatterystate) enum value for whether the device is any of the four states.

**Examples**

```js
await Battery.getBatteryStateAsync();
// BatteryState.CHARGING
```

### `Battery.isLowPowerModeEnabledAsync()`

Gets the current status of Low Power mode on iOS and Power Saver mode on Android. If a platform doesn't support Low Power mode reporting (like web, older Android devices), the reported low-power state is always `false`, even if the device is actually in low-power mode.

#### Returns

Returns a `Promise` that resolves to a `boolean` value of either `true` or `false`, indicating whether low power mode is enabled or disabled, respectively.

**Examples**

Low Power Mode (iOS) or Power Saver Mode (Android) are enabled.

```js
await Battery.isLowPowerModeEnabledAsync();
// true
```

### `Battery.getPowerStateAsync()`

Gets the power state of the device including the battery level, whether it is plugged in, and if the system is currently operating in Low Power Mode (iOS) or Power Saver Mode (Android). This method re-throws any errors that occur when retrieving any of the power-state information.

#### Returns

Returns a promise with an object with the following fields:

- **batteryLevel (_float_)** -- a number between 0 and 1, inclusive, or -1 if the battery level is unknown

- **batteryState (_BatteryState_)** -- a [`Battery.BatteryState`](#batterybatterystate) enum value

- **lowPowerMode (_boolean_)** -- `true` if lowPowerMode is on, `false` if lowPowerMode is off

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

On iOS devices, the event fires when the battery level drops one percent or more, but is only fired once per minute at maximum.

On Android devices, the event fires only when significant changes happens, which is when the battery level drops below [`"android.intent.action.BATTERY_LOW"`](https://developer.android.com/reference/android/content/Intent#ACTION_BATTERY_LOW) or rises above [`"android.intent.action.BATTERY_OKAY"`](https://developer.android.com/reference/android/content/Intent#ACTION_BATTERY_OKAY) from a low battery level. See [here](https://developer.android.com/training/monitoring-device-state/battery-monitoring) to read more from the Android docs.

On web, the event never fires.

#### Arguments

- **callback (_function_)** A callback that is invoked when battery level changes. The callback is provided a single argument that is an object with a `batteryLevel` key.

#### Returns

- An `EventSubscription` object on which you can call `remove()` to unsubscribe from the listener.

### `Battery.addBatteryStateListener(callback)`

Subscribe to the battery state change updates to receive an object with a [`Battery.BatteryState`](#batterybatterystate) enum value for whether the device is any of the four states. On web, the event never fires.

#### Arguments

- **callback (_function_)** A callback that is invoked when battery state changes. The callback is provided a single argument that is an object with a `batteryState` key.

#### Returns

- An `EventSubscription` object on which you can call `remove()` to unsubscribe from the listener.

### `Battery.addLowPowerModeListener(callback)`

Subscribe to Low Power Mode (iOS) or Power Saver Mode (Android) updates. The event fires whenever the power mode is toggled. On web, the event never fires.

#### Arguments

- **callback (_function_)** A callback that is invoked when Low Power Mode (iOS) or Power Saver Mode (Android) changes. The callback is provided a single argument that is an object with a `lowPowerMode` key.

#### Returns

- An `EventSubscription` object on which you can call `remove()` to unsubscribe from the listener.

## Enum types

### `Battery.BatteryState`

- **`BatteryState.UNKNOWN`** - if the battery state is unknown or unable to access
- **`BatteryState.UNPLUGGED`** - if battery is not charging or discharging
- **`BatteryState.CHARGING`** - if battery is charging
- **`BatteryState.FULL`** - if the battery level is full

**Examples**

```js
import React from 'react';
import * as Battery from 'expo-battery';
import { StyleSheet, Text, View } from 'react-native';

export default class App extends React.Component {
  state = {
    batteryLevel: null,
  };

  componentDidMount() {
    let batteryLevel = await Battery.getBatteryLevelAsync();
    this.setState({ batteryLevel });
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
