---
id: switch
title: Switch
---

Renders a boolean input.

This is a controlled component that requires an `onValueChange` callback that updates the `value` prop in order for the component to reflect user actions. If the `value` prop is not updated, the component will continue to render the supplied `value` prop instead of the expected result of any user actions.

```javascript
import React, { useState } from 'react';
import { Text, View, Switch } from 'react-native';

export default function App() {
  const [value, setValue] = useState(false);
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Switch
        value={value}
        onValueChange={v => {
          setValue(v);
        }}
      />
    </View>
  );
}
```

---

# Reference

## Props

Inherits [View Props](view.md#props).

### `disabled`

If true the user won't be able to toggle the switch. Default value is false.

| Type | Required |
| ---- | -------- |
| bool | No       |

---

### `ios_backgroundColor`

On iOS, custom color for the background. This background color can be seen either when the switch value is false or when the switch is disabled (and the switch is translucent).

| Type                | Required |
| ------------------- | -------- |
| [color](colors.md) | No       |

---

### `onChange`

Invoked when the user tries to change the value of the switch. Receives the change event as an argument. If you want to only receive the new value, use `onValueChange` instead.

| Type     | Required |
| -------- | -------- |
| function | No       |

---

### `onValueChange`

Invoked when the user tries to change the value of the switch. Receives the new value as an argument. If you want to instead receive an event, use `onChange`.

| Type     | Required |
| -------- | -------- |
| function | No       |

---

### `thumbColor`

Color of the foreground switch grip. If this is set on iOS, the switch grip will lose its drop shadow.

| Type                | Required |
| ------------------- | -------- |
| [color](colors.md) | No       |

---

### `trackColor`

Custom colors for the switch track.

_iOS_: When the switch value is false, the track shrinks into the border. If you want to change the color of the background exposed by the shrunken track, use [`ios_backgroundColor`](switch.md#ios_backgroundColor).

| Type                                                            | Required |
| --------------------------------------------------------------- | -------- |
| object: {false: [color](colors.md), true: [color](colors.md)} | No       |

---

### `value`

The value of the switch. If true the switch will be turned on. Default value is false.

| Type | Required |
| ---- | -------- |
| bool | No       |
