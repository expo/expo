---
id: alert
title: Alert
---

Launches an alert dialog with the specified title and message.

Optionally provide a list of buttons. Tapping any button will fire the respective onPress callback and dismiss the alert. By default, the only button will be an 'OK' button.

This is an API that works both on Android and iOS and can show static alerts. Alert that prompts the user to enter some information is available on iOS only.

## Example

| iOS                                                                            | Android                                                                                |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| ![iOS Alert Example](https://reactnative.dev/docs/assets/Alert/exampleios.gif) | ![Android Alert Example](https://reactnative.dev/docs/assets/Alert/exampleandroid.gif) |

```js
import React, { useState } from 'react';
import { View, StyleSheet, Button, Alert } from 'react-native';

const App = () => {
  const createTwoButtonAlert = () =>
    Alert.alert('Alert Title', 'My Alert Msg', [
      {
        text: 'Cancel',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      },
      { text: 'OK', onPress: () => console.log('OK Pressed') },
    ]);

  const createThreeButtonAlert = () =>
    Alert.alert('Alert Title', 'My Alert Msg', [
      {
        text: 'Ask me later',
        onPress: () => console.log('Ask me later pressed'),
      },
      {
        text: 'Cancel',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      },
      { text: 'OK', onPress: () => console.log('OK Pressed') },
    ]);

  return (
    <View style={styles.container}>
      <Button title={'2-Button Alert'} onPress={createTwoButtonAlert} />
      <Button title={'3-Button Alert'} onPress={createThreeButtonAlert} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});

export default App;
```

## iOS

On iOS you can specify any number of buttons. Each button can optionally specify a style, available options are represented by the [AlertButtonStyle](#alertbuttonstyle-ios) enum.

## Android

On Android at most three buttons can be specified. Android has a concept of a neutral, negative and a positive button:

- If you specify one button, it will be the 'positive' one (such as 'OK')
- Two buttons mean 'negative', 'positive' (such as 'Cancel', 'OK')
- Three buttons mean 'neutral', 'negative', 'positive' (such as 'Later', 'Cancel', 'OK')

Alerts on Android can be dismissed by tapping outside of the alert box. It is disabled by default and can be enabled by providing an optional [Options](#options-android) parameter with the cancelable property set to `true` i.e.<br/>`{ cancelable: true }`.

The cancel event can be handled by providing an `onDismiss` callback property inside the `options` parameter.

### Example **(Android)**

```js
import React from 'react';
import { View, StyleSheet, Button, Alert } from 'react-native';

const showAlert = () =>
  Alert.alert(
    'Alert Title',
    'My Alert Msg',
    [
      {
        text: 'Cancel',
        onPress: () => Alert.alert('Cancel Pressed'),
        style: 'cancel',
      },
    ],
    {
      cancelable: true,
      onDismiss: () =>
        Alert.alert('This alert was dismissed by tapping outside of the alert dialog.'),
    }
  );

const App = () => (
  <View style={styles.container}>
    <Button title="Show alert" onPress={showAlert} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
```

---

# Reference

## Methods

### `alert()`

```js
static alert(title, message?, buttons?, options?)
```

**Parameters:**

| Name                  | Type                        | Description                                                             |
| --------------------- | --------------------------- | ----------------------------------------------------------------------- |
| title **(Required)**  | string                      | The dialog's title. Passing `null` or empty string will hide the title. |
| message               | string                      | An optional message that appears below the dialog's title.              |
| buttons               | [Buttons](#buttons)         | An optional array containing buttons configuration.                     |
| options **(Android)** | [Options](#options-android) | An optional Alert configuration for the Android.                        |

---

### `prompt()` **(iOS)**

```js
static prompt(title, message?, callbackOrButtons?, type?, defaultValue?, keyboardType?)
```

Create and display a prompt to enter some text in form of Alert.

**Parameters:**

| Name                 | Type                             | Description                                                                                                                                                                                           |
| -------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| title **(Required)** | string                           | The dialog's title.                                                                                                                                                                                   |
| message              | string                           | An optional message that appears above the text input.                                                                                                                                                |
| callbackOrButtons    | function<hr/>[Buttons](#buttons) | If passed a function, it will be called with the prompt's value<br/>`(text: string) => void`, when the user taps 'OK'.<hr/>If passed an array, buttons will be configured based on the array content. |
| type                 | [AlertType](#alerttype-ios)      | This configures the text input.                                                                                                                                                                       |
| defaultValue         | string                           | The default text in text input.                                                                                                                                                                       |
| keyboardType         | string                           | The keyboard type of first text field (if exists). One of TextInput [keyboardTypes](textinput.md#keyboardtype).                                                                                       |

---

## Type Definitions

### AlertButtonStyle **(iOS)**

An iOS Alert button style.

| Type |
| ---- |
| enum |

**Constants:**

| Value           | Description               |
| --------------- | ------------------------- |
| `'default'`     | Default button style.     |
| `'cancel'`      | Cancel button style.      |
| `'destructive'` | Destructive button style. |

---

### AlertType **(iOS)**

An iOS Alert type.

| Type |
| ---- |
| enum |

**Constants:**

| Value              | Description                  |
| ------------------ | ---------------------------- |
| `'default'`        | Default alert with no inputs |
| `'plain-text'`     | Plain text input alert       |
| `'secure-text'`    | Secure text input alert      |
| `'login-password'` | Login and password alert     |

---

### Buttons

Array of objects containing Alert buttons configuration.

| Type             |
| ---------------- |
| array of objects |

**Objects properties:**

| Name            | Type                                      | Description                                             |
| --------------- | ----------------------------------------- | ------------------------------------------------------- |
| text            | string                                    | Button label.                                           |
| onPress         | function                                  | Callback function when button is pressed.               |
| style **(iOS)** | [AlertButtonStyle](#alertbuttonstyle-ios) | Button style, on Android this property will be ignored. |

---

### Options **(Android)**

| Type   |
| ------ |
| object |

**Properties:**

| Name       | Type     | Description                                                            |
| ---------- | -------- | ---------------------------------------------------------------------- |
| cancelable | boolean  | Defines if alert can be dismissed by tapping outside of the alert box. |
| onDismiss  | function | Callback function fired when alert has been dismissed.                 |
