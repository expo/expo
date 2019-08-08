---
id: activityindicator
title: ActivityIndicator
---

Displays a circular loading indicator.

### Example

```javascript
import React, { Component } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default class App extends Component {
  render() {
    return (
      <View style={[styles.container, styles.horizontal]}>
        <ActivityIndicator size="large" color="#0000ff" />
        <ActivityIndicator size="small" color="#00ff00" />
        <ActivityIndicator size="large" color="#0000ff" />
        <ActivityIndicator size="small" color="#00ff00" />
      </View>
    );
  }
}

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
```

### Props

- [View props...](../view/#props)

* [`animating`](../activityindicator/#animating)
* [`color`](../activityindicator/#color)
* [`hidesWhenStopped`](../activityindicator/#hideswhenstopped)
* [`size`](../activityindicator/#size)

---

# Reference

## Props

### `animating`

Whether to show the indicator (true, the default) or hide it (false).

| Type | Required |
| ---- | -------- |
| bool | No       |

---

### `color`

The foreground color of the spinner (default is gray on iOS and dark cyan on Android).

| Type                | Required |
| ------------------- | -------- |
| [color](../colors/) | No       |

---

### `hidesWhenStopped`

Whether the indicator should hide when not animating (true by default).

| Type | Required | Platform |
| ---- | -------- | -------- |
| bool | No       | iOS      |

---

### `size`

Size of the indicator (default is 'small'). Passing a number to the size prop is only supported on Android.

| Type                            | Required |
| ------------------------------- | -------- |
| enum('small', 'large'), ,number | No       |
