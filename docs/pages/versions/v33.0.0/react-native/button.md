---
id: button
title: Button
---

A basic button component that should render nicely on any platform. Supports a minimal level of customization.

<center><img src="https://facebook.github.io/react-native/docs/assets/buttonExample.png" /></center>

If this button doesn't look right for your app, you can build your own button using [TouchableOpacity](../touchableopacity/) or [TouchableNativeFeedback](../touchablenativefeedback/). For inspiration, look at the [source code for this button component](https://github.com/facebook/react-native/blob/master/Libraries/Components/Button.js). Or, take a look at the [wide variety of button components built by the community](https://js.coach/react-native?search=button).

Example usage:

```javascript

import { Button } from 'react-native';
...

<Button
  onPress={onPressLearnMore}
  title="Learn More"
  color="#841584"
  accessibilityLabel="Learn more about this purple button"
/>

```

### Props

- [`accessibilityLabel`](../button/#accessibilitylabel)
- [`color`](../button/#color)
- [`disabled`](../button/#disabled)
- [`hasTVPreferredFocus`](../button/#hastvpreferredfocus)
- [`nextFocusDown`](../view/#nextfocusdown)
- [`nextFocusForward`](../view/#nextfocusForward)
- [`nextFocusLeft`](../view/#nextfocusleft)
- [`nextFocusRight`](../view/#nextfocusright)
- [`nextFocusUp`](../view/#nextfocusleft)
- [`onPress`](../button/#onpress)
- [`testID`](../button/#testid)
- [`title`](../button/#title)
- [`touchSoundDisabled`](../button/#touchSoundDisabled)

---

# Reference

## Props

### `onPress`

Handler to be called when the user taps the button

| Type     | Required |
| -------- | -------- |
| function | Yes      |

---

### `title`

Text to display inside the button

| Type   | Required |
| ------ | -------- |
| string | Yes      |

---

### `accessibilityLabel`

Text to display for blindness accessibility features

| Type   | Required |
| ------ | -------- |
| string | No       |

---

### `color`

Color of the text (iOS), or background color of the button (Android)

| Type                | Required |
| ------------------- | -------- |
| [color](../colors/) | No       |

---

### `disabled`

If true, disable all interactions for this component.

| Type | Required |
| ---- | -------- |
| bool | No       |

---

### `testID`

Used to locate this view in end-to-end tests.

| Type   | Required |
| ------ | -------- |
| string | No       |

---

### `hasTVPreferredFocus`

_(Apple TV only)_ TV preferred focus (see documentation for the View component).

| Type | Required | Platform |
| ---- | -------- | -------- |
| bool | No       | iOS      |

### `nextFocusDown`

Designates the next view to receive focus when the user navigates down. See the [Android documentation](https://developer.android.com/reference/android/view/View.html#attr_android:nextFocusDown).

| Type   | Required | Platform |
| ------ | -------- | -------- |
| number | No       | Android  |

---

### `nextFocusForward`

Designates the next view to receive focus when the user navigates forward. See the [Android documentation](https://developer.android.com/reference/android/view/View.html#attr_android:nextFocusForward).

| Type   | Required | Platform |
| ------ | -------- | -------- |
| number | No       | Android  |

---

### `nextFocusLeft`

Designates the next view to receive focus when the user navigates left. See the [Android documentation](https://developer.android.com/reference/android/view/View.html#attr_android:nextFocusLeft).

| Type   | Required | Platform |
| ------ | -------- | -------- |
| number | No       | Android  |

---

### `nextFocusRight`

Designates the next view to receive focus when the user navigates right. See the [Android documentation](https://developer.android.com/reference/android/view/View.html#attr_android:nextFocusRight).

| Type   | Required | Platform |
| ------ | -------- | -------- |
| number | No       | Android  |

---

### `nextFocusUp`

Designates the next view to receive focus when the user navigates up. See the [Android documentation](https://developer.android.com/reference/android/view/View.html#attr_android:nextFocusUp).

| Type   | Required | Platform |
| ------ | -------- | -------- |
| number | No       | Android  |

---

### `touchSoundDisabled`

If true, doesn't play system sound on touch.

| Type    | Required | Platform |
| ------- | -------- | -------- |
| boolean | No       | Android  |
