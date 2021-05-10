---
id: keyboardavoidingview
title: KeyboardAvoidingView
---

It is a component to solve the common problem of views that need to move out of the way of the virtual keyboard. It can automatically adjust either its height, position, or bottom padding based on the position of the keyboard.

Example usage:

```jsx
import { KeyboardAvoidingView } from 'react-native';

<KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
  ... your UI ...
</KeyboardAvoidingView>;
```

### Example

![](https://reactnative.dev/docs/assets/KeyboardAvoidingView/example.gif)

---

# Reference

## Props

Inherits [View Props](view.md#props).

### `behavior`

Specify how to react to the presence of the keyboard.

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

---

### `keyboardVerticalOffset`

This is the distance between the top of the user screen and the react native view, may be non-zero in some use cases. Defaults to 0.

| Type   | Required |
| ------ | -------- |
| number | No       |
