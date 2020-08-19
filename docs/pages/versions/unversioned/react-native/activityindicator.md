---
id: activityindicator
title: ActivityIndicator
---

Displays a circular loading indicator.

## Example

```js
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

const App = () => (
  <View style={[styles.container, styles.horizontal]}>
    <ActivityIndicator />
    <ActivityIndicator size="large" />
    <ActivityIndicator size="small" color="#0000ff" />
    <ActivityIndicator size="large" color="#00ff00" />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  horizontal: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
});

export default App;
```

# Reference

## Props

Inherits [View Props](../view/#props).

---

### `animating`

Whether to show the indicator (`true`) or hide it (`false`).

| Type | Required | Default |
| ---- | -------- | ------- |
| bool | No       | `true`  |

---

### `color`

The foreground color of the spinner.

| Type            | Required | Default                                                                                                                                                                             |
| --------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [color](colors) | No       | `null` (system accent default color)<div class="label android">Android</div><hr/><ins style="background: #999" class="color-box"></ins>`'#999999'` <div class="label ios">iOS</div> |

---

### `hidesWhenStopped` <div class="label ios">iOS</div>

Whether the indicator should hide when not animating.

| Type | Required | Default |
| ---- | -------- | ------- |
| bool | No       | `true`  |

---

### `size`

Size of the indicator.

| Type                                                                           | Required | Default   |
| ------------------------------------------------------------------------------ | -------- | --------- |
| enum(`'small'`, `'large'`)<hr/>number <div class="label android">Android</div> | No       | `'small'` |
