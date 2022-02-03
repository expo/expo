---
id: animatedvaluexy
title: Animated.ValueXY
---

2D Value for driving 2D animations, such as pan gestures. Almost identical API to normal [`Animated.Value`](animatedvalue.md), but multiplexed. Contains two regular `Animated.Value`s under the hood.

## Example

```js
import React, { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';

const DraggableView = () => {
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event([
      null,
      {
        dx: pan.x, // x,y are Animated.Value
        dy: pan.y,
      },
    ]),
    onPanResponderRelease: () => {
      Animated.spring(
        pan, // Auto-multiplexed
        { toValue: { x: 0, y: 0 } } // Back to zero
      ).start();
    },
  });

  return (
    <View style={styles.container}>
      <Animated.View {...panResponder.panHandlers} style={[pan.getLayout(), styles.box]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    backgroundColor: '#61dafb',
    width: 80,
    height: 80,
    borderRadius: 4,
  },
});

export default DraggableView;
```

---

# Reference

## Methods

### `setValue()`

```js
setValue(value);
```

Directly set the value. This will stop any animations running on the value and update all the bound properties.

**Parameters:**

| Name  | Type   | Required | Description |
| ----- | ------ | -------- | ----------- |
| value | number | Yes      | Value       |

---

### `setOffset()`

```js
setOffset(offset);
```

Sets an offset that is applied on top of whatever value is set, whether via `setValue`, an animation, or `Animated.event`. Useful for compensating things like the start of a pan gesture.

**Parameters:**

| Name   | Type   | Required | Description  |
| ------ | ------ | -------- | ------------ |
| offset | number | Yes      | Offset value |

---

### `flattenOffset()`

```js
flattenOffset();
```

Merges the offset value into the base value and resets the offset to zero. The final output of the value is unchanged.

---

### `extractOffset()`

```js
extractOffset();
```

Sets the offset value to the base value, and resets the base value to zero. The final output of the value is unchanged.

---

### `addListener()`

```js
addListener(callback);
```

Adds an asynchronous listener to the value so you can observe updates from animations. This is useful because there is no way to synchronously read the value because it might be driven natively.

Returns a string that serves as an identifier for the listener.

**Parameters:**

| Name     | Type     | Required | Description                                                                                 |
| -------- | -------- | -------- | ------------------------------------------------------------------------------------------- |
| callback | function | Yes      | The callback function which will receive an object with a `value` key set to the new value. |

---

### `removeListener()`

```js
removeListener(id);
```

Unregister a listener. The `id` param shall match the identifier previously returned by `addListener()`.

**Parameters:**

| Name | Type   | Required | Description                        |
| ---- | ------ | -------- | ---------------------------------- |
| id   | string | Yes      | Id for the listener being removed. |

---

### `removeAllListeners()`

```js
removeAllListeners();
```

Remove all registered listeners.

---

### `stopAnimation()`

```js
stopAnimation([callback]);
```

Stops any running animation or tracking. `callback` is invoked with the final value after stopping the animation, which is useful for updating state to match the animation position with layout.

**Parameters:**

| Name     | Type     | Required | Description                                   |
| -------- | -------- | -------- | --------------------------------------------- |
| callback | function | No       | A function that will receive the final value. |

---

### `resetAnimation()`

```js
resetAnimation([callback]);
```

Stops any animation and resets the value to its original.

**Parameters:**

| Name     | Type     | Required | Description                                      |
| -------- | -------- | -------- | ------------------------------------------------ |
| callback | function | No       | A function that will receive the original value. |

---

### `getLayout()`

```js
getLayout();
```

Converts `{x, y}` into `{left, top}` for use in style, e.g.

```js
style={this.state.anim.getLayout()}
```

---

### `getTranslateTransform()`

```js
getTranslateTransform();
```

Converts `{x, y}` into a useable translation transform, e.g.

```js
style={{
  transform: this.state.anim.getTranslateTransform()
}}
```
