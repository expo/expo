---
id: touchablenativefeedback
title: TouchableNativeFeedback
---

> If you're looking for a more extensive and future-proof way to handle touch-based input, check out the [Pressable](pressable.md) API.

A wrapper for making views respond properly to touches (Android only). On Android this component uses native state drawable to display touch feedback.

At the moment it only supports having a single View instance as a child node, as it's implemented by replacing that View with another instance of RCTView node with some additional properties set.

Background drawable of native feedback touchable can be customized with `background` property.

## Example

```js
import React, { useState } from 'react';
import { Text, View, StyleSheet, TouchableNativeFeedback, StatusBar } from 'react-native';

const App = () => {
  const [rippleColor, setRippleColor] = useState(randomHexColor());
  const [rippleOverflow, setRippleOverflow] = useState(false);
  return (
    <View style={styles.container}>
      <TouchableNativeFeedback
        onPress={() => {
          setRippleColor(randomHexColor());
          setRippleOverflow(!rippleOverflow);
        }}
        background={TouchableNativeFeedback.Ripple(rippleColor, rippleOverflow)}>
        <View style={styles.touchable}>
          <Text style={styles.text}>TouchableNativeFeedback</Text>
        </View>
      </TouchableNativeFeedback>
    </View>
  );
};

const randomHexColor = () => {
  return '#000000'.replace(/0/g, function () {
    return (~~(Math.random() * 16)).toString(16);
  });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: StatusBar.currentHeight,
    backgroundColor: '#ecf0f1',
    padding: 8,
  },
  touchable: { flex: 0.5, borderColor: 'black', borderWidth: 1 },
  text: { alignSelf: 'center' },
});

export default App;
```

---

# Reference

## Props

### [TouchableWithoutFeedback Props](touchablewithoutfeedback.md#props)

Inherits [TouchableWithoutFeedback Props](touchablewithoutfeedback.md#props).

---

### `background`

Determines the type of background drawable that's going to be used to display feedback. It takes an object with `type` property and extra data depending on the `type`. It's recommended to use one of the static methods to generate that dictionary.

| Type               | Required |
| ------------------ | -------- |
| backgroundPropType | No       |

---

### `useForeground`

Set to true to add the ripple effect to the foreground of the view, instead of the background. This is useful if one of your child views has a background of its own, or you're e.g. displaying images, and you don't want the ripple to be covered by them.

Check TouchableNativeFeedback.canUseNativeForeground() first, as this is only available on Android 6.0 and above. If you try to use this on older versions you will get a warning and fallback to background.

| Type | Required |
| ---- | -------- |
| bool | No       |

---

### `hasTVPreferredFocus`

TV preferred focus (see documentation for the View component).

| Type | Required | Platform |
| ---- | -------- | -------- |
| bool | No       | Android  |

---

### `nextFocusDown`

TV next focus down (see documentation for the View component).

| Type   | Required | Platform |
| ------ | -------- | -------- |
| number | No       | Android  |

---

### `nextFocusForward`

TV next focus forward (see documentation for the View component).

| Type   | Required | Platform |
| ------ | -------- | -------- |
| number | No       | Android  |

---

### `nextFocusLeft`

TV next focus left (see documentation for the View component).

| Type   | Required | Platform |
| ------ | -------- | -------- |
| number | No       | Android  |

---

### `nextFocusRight`

TV next focus right (see documentation for the View component).

| Type   | Required | Platform |
| ------ | -------- | -------- |
| number | No       | Android  |

---

### `nextFocusUp`

TV next focus up (see documentation for the View component).

| Type   | Required | Platform |
| ------ | -------- | -------- |
| number | No       | Android  |

## Methods

### `SelectableBackground()`

```js
static SelectableBackground(rippleRadius: ?number)
```

Creates an object that represents android theme's default background for selectable elements (?android:attr/selectableItemBackground). `rippleRadius` parameter controls the radius of the ripple effect.

---

### `SelectableBackgroundBorderless()`

```js
static SelectableBackgroundBorderless(rippleRadius: ?number)
```

Creates an object that represent android theme's default background for borderless selectable elements (?android:attr/selectableItemBackgroundBorderless). Available on android API level 21+. `rippleRadius` parameter controls the radius of the ripple effect.

---

### `Ripple()`

```js
static Ripple(color: string, borderless: boolean, rippleRadius: ?number)
```

Creates an object that represents ripple drawable with specified color (as a string). If property `borderless` evaluates to true the ripple will render outside of the view bounds (see native actionbar buttons as an example of that behavior). This background type is available on Android API level 21+.

**Parameters:**

| Name         | Type    | Required | Description                                 |
| ------------ | ------- | -------- | ------------------------------------------- |
| color        | string  | Yes      | The ripple color                            |
| borderless   | boolean | Yes      | If the ripple can render outside its bounds |
| rippleRadius | ?number | No       | controls the radius of the ripple effect    |

---

### `canUseNativeForeground()`

```js
static canUseNativeForeground()
```
