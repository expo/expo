---
title: Battery
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-36/packages/expo-battery'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';
import TableOfContentSection from '~/components/plugins/TableOfContentSection';

**`expo-battery`** provides battery information for the physical device (such as battery level, whether or not the device is charging, and more) as well as corresponding event listeners.

<PlatformsSection android emulator ios web />

## Installation

<InstallSection packageName="expo-battery" />

## Example Usage

<SnackInline label='Basic Battery Usage' templateId='battery' dependencies={['expo-battery']}>

```js
import React from 'react';
import * as Battery from 'expo-battery';
import { StyleSheet, Text, View } from 'react-native';

export default class App extends React.Component {
  state = {
    batteryLevel: null,
  };

  async componentDidMount() {
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
```

</SnackInline>

## API

```js
import * as Battery from 'expo-battery';
```

<TableOfContentSection title='Methods' contents={['Battery.getBatteryLevelAsync()', 'Battery.getBatteryStateAsync()', 'Battery.isLowPowerModeEnabledAsync()', 'Battery.getPowerStateAsync()']}/>

<TableOfContentSection title='Event Subscriptions' contents={['Battery.addBatteryLevelListener(callback)', 'Battery.addBatteryStateListener(callback)', 'Battery.addLowPowerModeListener(callback)']} />

<TableOfContentSection title='Enum Types' contents={['Battery.BatteryState']} />

## Methods

### `Battery.isAvailableAsync()`

Resolves with whether this battery API is available on the current device. The value of this property is `true` on Android and physical iOS devices and `false` on iOS simulators. On web, it depends on whether the browser supports the web battery API.

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
