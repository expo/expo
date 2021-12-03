---
id: toastandroid
title: ToastAndroid
---

React Native's ToastAndroid API exposes the Android platform's ToastAndroid module as a JS module. It provides the method `show(message, duration)` which takes the following parameters:

- _message_ A string with the text to toast
- _duration_ The duration of the toast—either `ToastAndroid.SHORT` or `ToastAndroid.LONG`

You can alternatively use `showWithGravity(message, duration, gravity)` to specify where the toast appears in the screen's layout. May be `ToastAndroid.TOP`, `ToastAndroid.BOTTOM` or `ToastAndroid.CENTER`.

The 'showWithGravityAndOffset(message, duration, gravity, xOffset, yOffset)' method adds the ability to specify an offset with in pixels.

```js
import React from 'react';
import { View, StyleSheet, ToastAndroid, Button, StatusBar } from 'react-native';

const App = () => {
  const showToast = () => {
    ToastAndroid.show('A pikachu appeared nearby !', ToastAndroid.SHORT);
  };

  const showToastWithGravity = () => {
    ToastAndroid.showWithGravity(
      'All Your Base Are Belong To Us',
      ToastAndroid.SHORT,
      ToastAndroid.CENTER
    );
  };

  const showToastWithGravityAndOffset = () => {
    ToastAndroid.showWithGravityAndOffset(
      'A wild toast appeared!',
      ToastAndroid.LONG,
      ToastAndroid.BOTTOM,
      25,
      50
    );
  };

  return (
    <View style={styles.container}>
      <Button title="Toggle Toast" onPress={() => showToast()} />
      <Button title="Toggle Toast With Gravity" onPress={() => showToastWithGravity()} />
      <Button
        title="Toggle Toast With Gravity & Offset"
        onPress={() => showToastWithGravityAndOffset()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: StatusBar.currentHeight,
    backgroundColor: '#888888',
    padding: 8,
  },
});

export default App;
```

### Imperative hack

The ToastAndroid API is imperative, but there is a way to expose a declarative component from it as in this example:

```js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ToastAndroid, Button, StatusBar } from 'react-native';

const Toast = ({ visible, message }) => {
  if (visible) {
    ToastAndroid.showWithGravityAndOffset(message, ToastAndroid.LONG, ToastAndroid.BOTTOM, 25, 50);
    return null;
  }
  return null;
};

const App = () => {
  const [visibleToast, setvisibleToast] = useState(false);

  useEffect(() => setvisibleToast(false), [visibleToast]);

  const handleButtonPress = () => {
    setvisibleToast(true);
  };

  return (
    <View style={styles.container}>
      <Toast visible={visibleToast} message="Example" />
      <Button title="Toggle Toast" onPress={() => handleButtonPress()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: StatusBar.currentHeight,
    backgroundColor: '#888888',
    padding: 8,
  },
});

export default App;
```

---

# Reference

## Methods

### `show()`

```js
static show(message, duration)
```

---

### `showWithGravity()`

```js
static showWithGravity(message, duration, gravity)
```

---

### `showWithGravityAndOffset()`

```js
static showWithGravityAndOffset(message, duration, gravity, xOffset, yOffset)
```

## Properties

### `SHORT`

Indicates the duration on the screen.

```js
ToastAndroid.SHORT;
```

---

### `LONG`

Indicates the duration on the screen.

```js
ToastAndroid.LONG;
```

---

### `TOP`

Indicates the position on the screen.

```js
ToastAndroid.TOP;
```

---

### `BOTTOM`

Indicates the position on the screen.

```js
ToastAndroid.BOTTOM;
```

---

### `CENTER`

Indicates the position on the screen.

```js
ToastAndroid.CENTER;
```
