---
id: keyboard
title: Keyboard
---

`Keyboard` module to control keyboard events.

### Usage

The Keyboard module allows you to listen for native events and react to them, as well as make changes to the keyboard, like dismissing it.

```js
import React, { useState, useEffect } from 'react';
import { Keyboard, Text, TextInput, StyleSheet, View } from 'react-native';

const Example = () => {
  useEffect(() => {
    Keyboard.addListener('keyboardDidShow', _keyboardDidShow);
    Keyboard.addListener('keyboardDidHide', _keyboardDidHide);

    // cleanup function
    return () => {
      Keyboard.removeListener('keyboardDidShow', _keyboardDidShow);
      Keyboard.removeListener('keyboardDidHide', _keyboardDidHide);
    };
  }, []);

  const [keyboardStatus, setKeyboardStatus] = useState(undefined);
  const _keyboardDidShow = () => setKeyboardStatus('Keyboard Shown');
  const _keyboardDidHide = () => setKeyboardStatus('Keyboard Hidden');

  return (
    <View style={style.container}>
      <TextInput style={style.input} placeholder="Click here…" onSubmitEditing={Keyboard.dismiss} />
      <Text style={style.status}>{keyboardStatus}</Text>
    </View>
  );
};

const style = StyleSheet.create({
  container: {
    flex: 1,
    padding: 36,
  },
  input: {
    padding: 10,
    borderWidth: 0.5,
    borderRadius: 4,
  },
  status: {
    padding: 10,
    textAlign: 'center',
  },
});

export default Example;
```

---

# Reference

## Methods

### `addListener()`

```js
static addListener(eventName, callback)
```

The `addListener` function connects a JavaScript function to an identified native keyboard notification event.

This function then returns the reference to the listener.

**Parameters:**

| Name                     | Type     | Description                                                                    |
| ------------------------ | -------- | ------------------------------------------------------------------------------ |
| eventName **(Required)** | string   | The string that identifies the event you're listening for. See the list below. |
| callback **(Required)**  | function | The function to be called when the event fires                                 |

**`eventName`**

This can be any of the following:

- `keyboardWillShow`
- `keyboardDidShow`
- `keyboardWillHide`
- `keyboardDidHide`
- `keyboardWillChangeFrame`
- `keyboardDidChangeFrame`

> Note that if you set `android:windowSoftInputMode` to `adjustResize` or `adjustPan`, only `keyboardDidShow` and `keyboardDidHide` events will be available on Android. If you set `android:windowSoftInputMode` to `adjustNothing`, no events will be available on Android. `keyboardWillShow` as well as `keyboardWillHide` are generally not available on Android since there is no native corresponding event.

---

### `removeListener()`

```js
static removeListener(eventName, callback)
```

Removes a specific listener.

**Parameters:**

| Name      | Type     | Required | Description                                                                    |
| --------- | -------- | -------- | ------------------------------------------------------------------------------ |
| eventName | string   | Yes      | The `nativeEvent` is the string that identifies the event you're listening for |
| callback  | function | Yes      | The function to be called when the event fires                                 |

---

### `removeAllListeners()`

```js
static removeAllListeners(eventName)
```

Removes all listeners for a specific event type.

**Parameters:**

| Name      | Type   | Required | Description                                                          |
| --------- | ------ | -------- | -------------------------------------------------------------------- |
| eventType | string | Yes      | The native event string listeners are watching which will be removed |

---

### `dismiss()`

```js
static dismiss()
```

Dismisses the active keyboard and removes focus.

---

### `scheduleLayoutAnimation`

```js
static scheduleLayoutAnimation(event)
```

Useful for syncing TextInput (or other keyboard accessory view) size of position changes with keyboard movements.
