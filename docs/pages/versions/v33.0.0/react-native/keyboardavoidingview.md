---
id: keyboardavoidingview
title: KeyboardAvoidingView
---

It is a component to solve the common problem of views that need to move out of the way of the virtual keyboard. It can automatically adjust either its position or bottom padding based on the position of the keyboard.

Example usage:

```javascript
import { KeyboardAvoidingView } from 'react-native';

<KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
  ... your UI ...
</KeyboardAvoidingView>;
```

### Example

![](https://facebook.github.io/react-native/docs/assets/KeyboardAvoidingView/example.gif)

### Props

- [View props...](../view/#props)

* [`keyboardVerticalOffset`](../keyboardavoidingview/#keyboardverticaloffset)
* [`behavior`](../keyboardavoidingview/#behavior)
* [`contentContainerStyle`](../keyboardavoidingview/#contentcontainerstyle)
* [`enabled`](../keyboardavoidingview/#enabled)

---

# Reference

## Props

### `keyboardVerticalOffset`

This is the distance between the top of the user screen and the react native view, may be non-zero in some use cases.

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `behavior`

_Note: Android and iOS both interact with this prop differently._ _Android may behave better when given no behavior prop at all, whereas iOS is the opposite._

| Type                                  | Required |
| ------------------------------------- | -------- |
| enum('height', 'position', 'padding') | No       |

---

### `contentContainerStyle`

The style of the content container(View) when behavior is 'position'.

| Type       | Required |
| ---------- | -------- |
| View.style | No       |

---

### `enabled`

Enabled or disabled KeyboardAvoidingView. The default is `true`.

| Type    | Required |
| ------- | -------- |
| boolean | No       |
