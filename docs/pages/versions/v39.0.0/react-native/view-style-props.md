---
id: view-style-props
title: View Style Props
---

### Example

```js
import React from 'react';
import { View, StyleSheet } from 'react-native';

const ViewStyleProps = () => {
  return (
    <View style={styles.container}>
      <View style={styles.top} />
      <View style={styles.middle} />
      <View style={styles.bottom} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 20,
    margin: 10,
  },
  top: {
    flex: 0.3,
    backgroundColor: 'grey',
    borderWidth: 5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  middle: {
    flex: 0.3,
    backgroundColor: 'beige',
    borderWidth: 5,
  },
  bottom: {
    flex: 0.3,
    backgroundColor: 'pink',
    borderWidth: 5,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
});

export default ViewStyleProps;
```

# Reference

## Props

### `borderRightColor`

| Type                                         | Required |
| -------------------------------------------- | -------- |
| [color](https://reactnative.dev/docs/colors) | No       |

---

### `backfaceVisibility`

| Type                      | Required |
| ------------------------- | -------- |
| enum('visible', 'hidden') | No       |

---

### `borderBottomColor`

| Type                                         | Required |
| -------------------------------------------- | -------- |
| [color](https://reactnative.dev/docs/colors) | No       |

---

### `borderBottomEndRadius`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `borderBottomLeftRadius`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `borderBottomRightRadius`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `borderBottomStartRadius`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `borderBottomWidth`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `borderColor`

| Type                                         | Required |
| -------------------------------------------- | -------- |
| [color](https://reactnative.dev/docs/colors) | No       |

---

### `borderEndColor`

| Type                                         | Required |
| -------------------------------------------- | -------- |
| [color](https://reactnative.dev/docs/colors) | No       |

---

### `borderLeftColor`

| Type                                         | Required |
| -------------------------------------------- | -------- |
| [color](https://reactnative.dev/docs/colors) | No       |

---

### `borderLeftWidth`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `borderRadius`

If the rounded border is not visible, try applying `overflow: 'hidden'` as well.

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `backgroundColor`

| Type                                         | Required |
| -------------------------------------------- | -------- |
| [color](https://reactnative.dev/docs/colors) | No       |

---

### `borderRightWidth`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `borderStartColor`

| Type                                         | Required |
| -------------------------------------------- | -------- |
| [color](https://reactnative.dev/docs/colors) | No       |

---

### `borderStyle`

| Type                              | Required |
| --------------------------------- | -------- |
| enum('solid', 'dotted', 'dashed') | No       |

---

### `borderTopColor`

| Type                                         | Required |
| -------------------------------------------- | -------- |
| [color](https://reactnative.dev/docs/colors) | No       |

---

### `borderTopEndRadius`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `borderTopLeftRadius`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `borderTopRightRadius`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `borderTopStartRadius`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `borderTopWidth`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `borderWidth`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `opacity`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `elevation`

(Android-only) Sets the elevation of a view, using Android's underlying [elevation API](https://developer.android.com/training/material/shadows-clipping.html#Elevation). This adds a drop shadow to the item and affects z-order for overlapping views. Only supported on Android 5.0+, has no effect on earlier versions.

| Type   | Required | Platform |
| ------ | -------- | -------- |
| number | No       | Android  |
