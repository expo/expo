---
id: dimensions
title: Dimensions
---

> [`useWindowDimensions`](usewindowdimensions.md) is the preferred API for React components. Unlike `Dimensions`, it updates as the window's dimensions update. This works nicely with the React paradigm.

```js
import { Dimensions } from 'react-native';
```

You can get the application window's width and height using the following code:

```js
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
```

> Although dimensions are available immediately, they may change (e.g due to device rotation, foldable devices etc) so any rendering logic or styles that depend on these constants should try to call this function on every render, rather than caching the value (for example, using inline styles rather than setting a value in a `StyleSheet`).

If you are targeting foldable devices or devices which can change the screen size or app window size, you can use the event listener available in the Dimensions module as shown in the below example.

## Example

```js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';

const window = Dimensions.get('window');
const screen = Dimensions.get('screen');

const App = () => {
  const [dimensions, setDimensions] = useState({ window, screen });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window, screen }) => {
      setDimensions({ window, screen });
    });
    return () => subscription?.remove();
  });

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Window Dimensions</Text>
      {Object.entries(dimensions.window).map(([key, value]) => (
        <Text>
          {key} - {value}
        </Text>
      ))}
      <Text style={styles.header}>Screen Dimensions</Text>
      {Object.entries(dimensions.screen).map(([key, value]) => (
        <Text>
          {key} - {value}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 16,
    marginVertical: 10,
  },
});

export default App;
```

# Reference

## Methods

### `addEventListener()`

```js
static addEventListener(type, handler)
```

Add an event handler. Supported events:

- `change`: Fires when a property within the `Dimensions` object changes. The argument to the event handler is a [`DimensionsValue`](#dimensionsvalue) type object.

---

### `get()`

```js
static get(dim)
```

Initial dimensions are set before `runApplication` is called so they should be available before any other require's are run, but may be updated later.

Example: `const {height, width} = Dimensions.get('window');`

**Parameters:**

| Name               | Type   | Description                                                                       |
| ------------------ | ------ | --------------------------------------------------------------------------------- |
| dim **(Required)** | string | Name of dimension as defined when calling `set`. Returns value for the dimension. |

> For Android the `window` dimension will exclude the size used by the `status bar` (if not translucent) and `bottom navigation bar`

---

### `removeEventListener()`

```js
static removeEventListener(type, handler)
```

> **Deprecated.** Use the `remove()` method on the event subscription returned by [`addEventListener()`](#addeventlistener).

---

### `set()`

```js
static set(dims)
```

This should only be called from native code by sending the `didUpdateDimensions` event.

**Parameters:**

| Name              | Type   | Description                               |
| ----------------- | ------ | ----------------------------------------- |
| dims **Required** | object | String-keyed object of dimensions to set. |

---

## Type Definitions

### DimensionsValue

**Properties:**

| Name   | Type                              | Description                             |
| ------ | --------------------------------- | --------------------------------------- |
| window | [DisplayMetrics](#displaymetrics) | Size of the visible Application window. |
| screen | [DisplayMetrics](#displaymetrics) | Size of the device's screen.            |

### DisplayMetrics

| Type   |
| ------ |
| object |

**Properties:**

| Name      | Type   |
| --------- | ------ |
| width     | number |
| height    | number |
| scale     | number |
| fontScale | number |
