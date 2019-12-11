---
id: dimensions
title: Dimensions
---

```jsx
import { Dimensions } from 'react-native';
```

You can get device width and height using below :

Get device screen width and height :

```jsx
const screenWidth = Math.round(Dimensions.get('window').width);
const screenHeight = Math.round(Dimensions.get('window').height);
```

# Reference

## Methods

### `addEventListener()`

```jsx

static addEventListener(type, handler)

```

Add an event handler. Supported events:

- `change`: Fires when a property within the `Dimensions` object changes. The argument to the event handler is an object with `window` and `screen` properties whose values are the same as the return values of `Dimensions.get('window')` and `Dimensions.get('screen')`, respectively.

---

### `get()`

```jsx

static get(dim)

```

Initial dimensions are set before `runApplication` is called so they should be available before any other require's are run, but may be updated later.

> Note: Although dimensions are available immediately, they may change (e.g due to device rotation) so any rendering logic or styles that depend on these constants should try to call this function on every render, rather than caching the value (for example, using inline styles rather than setting a value in a `StyleSheet`).

Example: `var {height, width} = Dimensions.get('window');`

**Parameters:**

| Name | Type   | Required | Description                                                                                  |
| ---- | ------ | -------- | -------------------------------------------------------------------------------------------- |
| dim  | string | Yes      | Name of dimension as defined when calling `set`. @returns {Object?} Value for the dimension. |

> For Android the `window` dimension will exclude the size used by the `status bar` (if not translucent) and `bottom navigation bar`

---

### `removeEventListener()`

```jsx

static removeEventListener(type, handler)

```

Remove an event handler.

---

### `set()`

```jsx

static set(dims)

```

This should only be called from native code by sending the didUpdateDimensions event.

**Parameters:**

| Name | Type   | Required | Description                              |
| ---- | ------ | -------- | ---------------------------------------- |
| dims | object | Yes      | string-keyed object of dimensions to set |
