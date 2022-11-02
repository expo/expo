---
id: pressable
title: Pressable
---

Pressable is a Core Component wrapper that can detect various stages of press interactions on any of its defined children.

```js
<Pressable onPress={onPressFunction}>
  <Text>I'm pressable!</Text>
</Pressable>
```

## How it works

On an element wrapped by `Pressable`:

- [`onPressIn`](#onpressin) is called when a press is activated.
- [`onPressOut`](#onpressout) is called when the press gesture is deactivated.

After pressing [`onPressIn`](#onpressin), one of two things will happen:

1. The person will remove their finger, triggering [`onPressOut`](#onpressout) followed by [`onPress`](#onpress).
2. If the person leaves their finger longer than 500 milliseconds before removing it, [`onLongPress`](#onlongpress) is triggered. ([`onPressOut`](#onpressout) will still fire when they remove their finger.)

<img src="/static/images/d_pressable_pressing.svg" width="1000" alt="Diagram of the onPress events in sequence." />

Fingers are not the most precise instruments, and it is common for users to accidentally activate the wrong element or miss the activation area. To help, `Pressable` has an optional `HitRect` you can use to define how far a touch can register away from the wrapped element. Presses can start anywhere within a `HitRect`.

`PressRect` allows presses to move beyond the element and its `HitRect` while maintaining activation and being eligible for a "press"—think of sliding your finger slowly away from a button you're pressing down on.

> The touch area never extends past the parent view bounds and the Z-index of sibling views always takes precedence if a touch hits two overlapping views.

<figure>
  <img src="/static/images/d_pressable_anatomy.svg" width="1000" alt="Diagram of HitRect and PressRect and how they work." />
  <figcaption>
    You can set <code>HitRect</code> with <code>hitSlop</code> and set <code>PressRect</code> with <code>pressRetentionOffset</code>.
  </figcaption>
</figure>

> `Pressable` uses React Native's `Pressability` API. For more information around the state machine flow of Pressability and how it works, check out the implementation for [Pressability](https://github.com/facebook/react-native/blob/16ea9ba8133a5340ed6751ec7d49bf03a0d4c5ea/Libraries/Pressability/Pressability.js#L347).

## Example

```js
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const App = () => {
  const [timesPressed, setTimesPressed] = useState(0);

  let textLog = '';
  if (timesPressed > 1) {
    textLog = timesPressed + 'x onPress';
  } else if (timesPressed > 0) {
    textLog = 'onPress';
  }

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => {
          setTimesPressed(current => current + 1);
        }}
        style={({ pressed }) => [
          {
            backgroundColor: pressed ? 'rgb(210, 230, 255)' : 'white',
          },
          styles.wrapperCustom,
        ]}>
        {({ pressed }) => <Text style={styles.text}>{pressed ? 'Pressed!' : 'Press Me'}</Text>}
      </Pressable>
      <View style={styles.logBox}>
        <Text testID="pressable_press_console">{textLog}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
  },
  wrapperCustom: {
    borderRadius: 8,
    padding: 6,
  },
  logBox: {
    padding: 20,
    margin: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
  },
});

export default App;
```

## Props

### `android_disableSound` **(Android)**

If true, doesn't play Android system sound on press.

| Type    | Required | Default |
| ------- | -------- | ------- |
| boolean | No       | `false` |

### `android_ripple` **(Android)**

Enables the Android ripple effect and configures its properties.

| Type                          | Required |
| ----------------------------- | -------- |
| [RippleConfig](#rippleconfig) | No       |

### `children`

Either children or a function that receives a boolean reflecting whether the component is currently pressed.

| Type                        | Required |
| --------------------------- | -------- |
| [React Node](react-node.md) | No       |

### `unstable_pressDelay`

Duration (in milliseconds) to wait after press down before calling `onPressIn`.

| Type   | Required |
| ------ | -------- |
| number | No       |

### `delayLongPress`

Duration (in milliseconds) from `onPressIn` before `onLongPress` is called.

| Type   | Required | Default |
| ------ | -------- | ------- |
| number | No       | `500`   |

### `disabled`

Whether the press behavior is disabled.

| Type    | Required | Default |
| ------- | -------- | ------- |
| boolean | No       | `false` |

### `hitSlop`

Sets additional distance outside of element in which a press can be detected.

| Type                      | Required |
| ------------------------- | -------- |
| [Rect](rect.md) or number | No       |

### `onLongPress`

Called if the time after `onPressIn` lasts longer than 500 milliseconds. This time period can be customized with [`delayLongPress`](#delaylongpress).

| Type                        | Required |
| --------------------------- | -------- |
| [PressEvent](pressevent.md) | No       |

### `onPress`

Called after `onPressOut`.

| Type                        | Required |
| --------------------------- | -------- |
| [PressEvent](pressevent.md) | No       |

### `onPressIn`

Called immediately when a touch is engaged, before `onPressOut` and `onPress`.

| Type                        | Required |
| --------------------------- | -------- |
| [PressEvent](pressevent.md) | No       |

### `onPressOut`

Called when a touch is released.

| Type                        | Required |
| --------------------------- | -------- |
| [PressEvent](pressevent.md) | No       |

### `pressRetentionOffset`

Additional distance outside of this view in which a touch is considered a press before `onPressOut` is triggered.

| Type                      | Required | Default                                        |
| ------------------------- | -------- | ---------------------------------------------- |
| [Rect](rect.md) or number | No       | `{ bottom: 30, left: 20, right: 20, top: 20 }` |

### `style`

Either view styles or a function that receives a boolean reflecting whether the component is currently pressed and returns view styles.

| Type                              | Required |
| --------------------------------- | -------- |
| [View Style](view-style-props.md) | No       |

### `testOnly_pressed`

Used only for documentation or testing (e.g. snapshot testing).

| Type    | Required | Default |
| ------- | -------- | ------- |
| boolean | No       | `false` |

## Type Definitions

### RippleConfig

Ripple effect configuration for the `android_ripple` property.

| Type   |
| ------ |
| object |

**Properties:**

| Name       | Type                                              | Required | Description                                         |
| ---------- | ------------------------------------------------- | -------- | --------------------------------------------------- |
| color      | [color](https://reactnative.dev/docs/0.64/colors) | No       | Defines the color of the ripple effect.             |
| borderless | boolean                                           | No       | Defines if ripple effect should not include border. |
| radius     | number                                            | No       | Defines the radius of the ripple effect.            |
