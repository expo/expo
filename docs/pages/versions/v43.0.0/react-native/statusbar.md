---
id: statusbar
title: StatusBar
---

Component to control the app status bar.

### Usage with Navigator

It is possible to have multiple `StatusBar` components mounted at the same time. The props will be merged in the order the `StatusBar` components were mounted.

```js
import React, { useState } from 'react';
import { Button, Platform, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';

const STYLES = ['default', 'dark-content', 'light-content'];
const TRANSITIONS = ['fade', 'slide', 'none'];

const App = () => {
  const [hidden, setHidden] = useState(false);
  const [statusBarStyle, setStatusBarStyle] = useState(STYLES[0]);
  const [statusBarTransition, setStatusBarTransition] = useState(TRANSITIONS[0]);

  const changeStatusBarVisibility = () => setHidden(!hidden);

  const changeStatusBarStyle = () => {
    const styleId = STYLES.indexOf(statusBarStyle) + 1;
    if (styleId === STYLES.length) {
      setStatusBarStyle(STYLES[0]);
    } else {
      setStatusBarStyle(STYLES[styleId]);
    }
  };

  const changeStatusBarTransition = () => {
    const transition = TRANSITIONS.indexOf(statusBarTransition) + 1;
    if (transition === TRANSITIONS.length) {
      setStatusBarTransition(TRANSITIONS[0]);
    } else {
      setStatusBarTransition(TRANSITIONS[transition]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        animated={true}
        backgroundColor="#61dafb"
        barStyle={statusBarStyle}
        showHideTransition={statusBarTransition}
        hidden={hidden}
      />
      <Text style={styles.textStyle}>
        StatusBar Visibility:{'\n'}
        {hidden ? 'Hidden' : 'Visible'}
      </Text>
      <Text style={styles.textStyle}>
        StatusBar Style:{'\n'}
        {statusBarStyle}
      </Text>
      {Platform.OS === 'ios' ? (
        <Text style={styles.textStyle}>
          StatusBar Transition:{'\n'}
          {statusBarTransition}
        </Text>
      ) : null}
      <View style={styles.buttonsContainer}>
        <Button title="Toggle StatusBar" onPress={changeStatusBarVisibility} />
        <Button title="Change StatusBar Style" onPress={changeStatusBarStyle} />
        {Platform.OS === 'ios' ? (
          <Button title="Change StatusBar Transition" onPress={changeStatusBarTransition} />
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ECF0F1',
  },
  buttonsContainer: {
    padding: 10,
  },
  textStyle: {
    textAlign: 'center',
    marginBottom: 8,
  },
});

export default App;
```

### Imperative API

For cases where using a component is not ideal, there is also an imperative API exposed as static functions on the component. It is however not recommended to use the static API and the component for the same prop because any value set by the static API will get overridden by the one set by the component in the next render.

---

# Reference

## Constants

### `currentHeight` **(Android)**

The height of the status bar, which includes the notch height, if present.

---

## Props

### `animated`

If the transition between status bar property changes should be animated. Supported for `backgroundColor`, `barStyle` and `hidden` properties.

| Type    | Required | Default |
| ------- | -------- | ------- |
| boolean | No       | `false` |

---

### `backgroundColor` **(Android)**

The background color of the status bar.

| Type                                              | Required | Default                                                                |
| ------------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| [color](https://reactnative.dev/docs/0.64/colors) | No       | default system StatusBar background color, or `'black'` if not defined |

---

### `barStyle`

Sets the color of the status bar text.

On Android, this will only have an impact on API versions 23 and above.

| Type                              | Required | Default     |
| --------------------------------- | -------- | ----------- |
| [StatusBarStyle](#statusbarstyle) | No       | `'default'` |

---

### `hidden`

If the status bar is hidden.

| Type    | Required | Default |
| ------- | -------- | ------- |
| boolean | No       | `false` |

---

### `networkActivityIndicatorVisible` **(iOS)**

If the network activity indicator should be visible.

| Type    | Default |
| ------- | ------- |
| boolean | `false` |

---

### `showHideTransition` **(iOS)**

The transition effect when showing and hiding the status bar using the `hidden` prop.

| Type                                      | Default  |
| ----------------------------------------- | -------- |
| [StatusBarAnimation](#statusbaranimation) | `'fade'` |

---

### `translucent` **(Android)**

If the status bar is translucent. When translucent is set to `true`, the app will draw under the status bar. This is useful when using a semi transparent status bar color.

| Type    | Default |
| ------- | ------- |
| boolean | `false` |

## Methods

### `popStackEntry()`

```js
static popStackEntry(entry: any)
```

Get and remove the last StatusBar entry from the stack.

**Parameters:**

| Name                 | Type | Description                           |
| -------------------- | ---- | ------------------------------------- |
| entry **(Required)** | any  | Entry returned from `pushStackEntry`. |

---

### `pushStackEntry()`

```js
static pushStackEntry(props: any)
```

Push a StatusBar entry onto the stack. The return value should be passed to `popStackEntry` when complete.

**Parameters:**

| Name                 | Type | Description                                                      |
| -------------------- | ---- | ---------------------------------------------------------------- |
| props **(Required)** | any  | Object containing the StatusBar props to use in the stack entry. |

---

### `replaceStackEntry()`

```js
static replaceStackEntry(entry: any, props: any)
```

Replace an existing StatusBar stack entry with new props.

**Parameters:**

| Name                 | Type | Description                                                                  |
| -------------------- | ---- | ---------------------------------------------------------------------------- |
| entry **(Required)** | any  | Entry returned from `pushStackEntry` to replace.                             |
| props **(Required)** | any  | Object containing the StatusBar props to use in the replacement stack entry. |

---

### `setBackgroundColor()` **(Android)**

```js
static setBackgroundColor(color: string, [animated]: boolean)
```

Set the background color for the status bar.

**Parameters:**

| Name                 | Type    | Description               |
| -------------------- | ------- | ------------------------- |
| color **(Required)** | string  | Background color.         |
| animated             | boolean | Animate the style change. |

---

### `setBarStyle()`

```js
static setBarStyle(style: StatusBarStyle, [animated]: boolean)
```

Set the status bar style.

**Parameters:**

| Name                 | Type                              | Description               |
| -------------------- | --------------------------------- | ------------------------- |
| style **(Required)** | [StatusBarStyle](#statusbarstyle) | Status bar style to set.  |
| animated             | boolean                           | Animate the style change. |

---

### `setHidden()`

```js
static setHidden(hidden: boolean, [animation]: StatusBarAnimation)
```

Show or hide the status bar.

**Parameters:**

| Name                  | Type                                      | Description                                             |
| --------------------- | ----------------------------------------- | ------------------------------------------------------- |
| hidden **(Required)** | boolean                                   | Hide the status bar.                                    |
| animation **(iOS)**   | [StatusBarAnimation](#statusbaranimation) | Animation when changing the status bar hidden property. |

---

### `setNetworkActivityIndicatorVisible()` **(iOS)**

```js
static setNetworkActivityIndicatorVisible(visible: boolean)
```

Control the visibility of the network activity indicator.

**Parameters:**

| Name                   | Type    | Description         |
| ---------------------- | ------- | ------------------- |
| visible **(Required)** | boolean | Show the indicator. |

---

### `setTranslucent()` **(Android)**

```js
static setTranslucent(translucent: boolean)
```

Control the translucency of the status bar.

**Parameters:**

| Name                       | Type    | Description         |
| -------------------------- | ------- | ------------------- |
| translucent **(Required)** | boolean | Set as translucent. |

## Type Definitions

### StatusBarAnimation

Status bar animation type for transitions on the iOS.

| Type |
| ---- |
| enum |

**Constants:**

| Value     | Type   | Description     |
| --------- | ------ | --------------- |
| `'fade'`  | string | Fade animation  |
| `'slide'` | string | Slide animation |
| `'none'`  | string | No animation    |

---

### StatusBarStyle

Status bar style type.

| Type |
| ---- |
| enum |

**Constants:**

| Value             | Type   | Description                                                          |
| ----------------- | ------ | -------------------------------------------------------------------- |
| `'default'`       | string | Default status bar style (dark for iOS, light for Android)           |
| `'light-content'` | string | Dark background, white texts and icons                               |
| `'dark-content'`  | string | Light background, dark texts and icons (requires API>=23 on Android) |
