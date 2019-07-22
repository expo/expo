---
id: progressbarandroid
title: ProgressBarAndroid
---

Android-only React component used to indicate that the app is loading or there is some activity in the app.

Example:

```javascript
import React, { Component } from 'react';
import { ProgressBarAndroid, StyleSheet, View } from 'react-native';

export default class App extends Component {
  render() {
    return (
      <View style={styles.container}>
        <ProgressBarAndroid />
        <ProgressBarAndroid styleAttr="Horizontal" />
        <ProgressBarAndroid styleAttr="Horizontal" color="#2196F3" />
        <ProgressBarAndroid styleAttr="Horizontal" indeterminate={false} progress={0.5} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-evenly',
    padding: 10,
  },
});
```

### Props

- [View props...](../view/#props)

* [`animating`](../progressbarandroid/#animating)
* [`color`](../progressbarandroid/#color)
* [`indeterminate`](../progressbarandroid/#indeterminate)
* [`progress`](../progressbarandroid/#progress)
* [`styleAttr`](../progressbarandroid/#styleattr)
* [`testID`](../progressbarandroid/#testid)

---

# Reference

## Props

### `animating`

Whether to show the ProgressBar (true, the default) or hide it (false).

| Type | Required |
| ---- | -------- |
| bool | No       |

---

### `color`

Color of the progress bar.

| Type                | Required |
| ------------------- | -------- |
| [color](../colors/) | No       |

---

### `indeterminate`

If the progress bar will show indeterminate progress. Note that this can only be false if styleAttr is Horizontal.

| Type              | Required |
| ----------------- | -------- |
| indeterminateType | No       |

---

### `progress`

The progress value (between 0 and 1).

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `styleAttr`

Style of the ProgressBar. One of:

- Horizontal
- Normal (default)
- Small
- Large
- Inverse
- SmallInverse
- LargeInverse

| Type                                                                                      | Required |
| ----------------------------------------------------------------------------------------- | -------- |
| enum('Horizontal', 'Normal', 'Small', 'Large', 'Inverse', 'SmallInverse', 'LargeInverse') | No       |

---

### `testID`

Used to locate this view in end-to-end tests.

| Type   | Required |
| ------ | -------- |
| string | No       |
