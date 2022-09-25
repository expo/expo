---
id: switch
title: Switch
---

Renders a boolean input.

This is a controlled component that requires an `onValueChange` callback that updates the `value` prop in order for the component to reflect user actions. If the `value` prop is not updated, the component will continue to render the supplied `value` prop instead of the expected result of any user actions.

## Example

```js
import React, { useState } from 'react';
import { View, Switch, StyleSheet } from 'react-native';

const App = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const toggleSwitch = () => setIsEnabled(previousState => !previousState);

  return (
    <View style={styles.container}>
      <Switch
        trackColor={{ false: '#767577', true: '#81b0ff' }}
        thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
        onValueChange={toggleSwitch}
        value={isEnabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
```

---

# Reference

## Props

### [View Props](view.md#props)

Inherits [View Props](view.md#props).

---

### `disabled`

If true the user won't be able to toggle the switch.

| Type | Default |
| ---- | ------- |
| bool | `false` |

---

### `ios_backgroundColor` **(iOS)**

On iOS, custom color for the background. This background color can be seen either when the switch value is `false` or when the switch is disabled (and the switch is translucent).

| Type                                              |
| ------------------------------------------------- |
| [color](https://reactnative.dev/docs/0.64/colors) |

---

### `onChange`

Invoked when the user tries to change the value of the switch. Receives the change event as an argument. If you want to only receive the new value, use `onValueChange` instead.

| Type     |
| -------- |
| function |

---

### `onValueChange`

Invoked when the user tries to change the value of the switch. Receives the new value as an argument. If you want to instead receive an event, use `onChange`.

| Type     |
| -------- |
| function |

---

### `thumbColor`

Color of the foreground switch grip. If this is set on iOS, the switch grip will lose its drop shadow.

| Type                                              |
| ------------------------------------------------- |
| [color](https://reactnative.dev/docs/0.64/colors) |

---

### `trackColor`

Custom colors for the switch track.

_iOS_: When the switch value is `false`, the track shrinks into the border. If you want to change the color of the background exposed by the shrunken track, use [`ios_backgroundColor`](#ios_backgroundColor-ios).

| Type                                                                                                                                        |
|---------------------------------------------------------------------------------------------------------------------------------------------|
| object: &lbrace; false: [color](https://reactnative.dev/docs/0.64/colors), true: [color](https://reactnative.dev/docs/0.64/colors) &rbrace; |

---

### `value`

The value of the switch. If true the switch will be turned on. Default value is false.

| Type |
| ---- |
| bool |
