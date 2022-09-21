---
id: touchablewithoutfeedback
title: TouchableWithoutFeedback
---

> If you're looking for a more extensive and future-proof way to handle touch-based input, check out the [Pressable](pressable.md) API.

Do not use unless you have a very good reason. All elements that respond to press should have a visual feedback when touched.

`TouchableWithoutFeedback` supports only one child. If you wish to have several child components, wrap them in a View. Importantly, `TouchableWithoutFeedback` works by cloning its child and applying responder props to it. It is therefore required that any intermediary components pass through those props to the underlying React Native component.

## Usage Pattern

```js
function MyComponent(props) {
  return (
    <View {...props} style={{ flex: 1, backgroundColor: '#fff' }}>
      <Text>My Component</Text>
    </View>
  );
}

<TouchableWithoutFeedback onPress={() => alert('Pressed!')}>
  <MyComponent />
</TouchableWithoutFeedback>;
```

## Example

```js
import React, { useState } from 'react';
import { StyleSheet, TouchableWithoutFeedback, Text, View } from 'react-native';

const TouchableWithoutFeedbackExample = () => {
  const [count, setCount] = useState(0);

  const onPress = () => {
    setCount(count + 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.countContainer}>
        <Text style={styles.countText}>Count: {count}</Text>
      </View>
      <TouchableWithoutFeedback onPress={onPress}>
        <View style={styles.button}>
          <Text>Touch Here</Text>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10,
  },
  countContainer: {
    alignItems: 'center',
    padding: 10,
  },
  countText: {
    color: '#FF00FF',
  },
});

export default TouchableWithoutFeedbackExample;
```

---

# Reference

## Props

### `accessibilityIgnoresInvertColors`

| Type    | Required |
| ------- | -------- |
| Boolean | No       |

---

### `accessible`

When `true`, indicates that the view is an accessibility element. By default, all the touchable elements are accessible.

| Type | Required |
| ---- | -------- |
| bool | No       |

---

### `accessibilityLabel`

Overrides the text that's read by the screen reader when the user interacts with the element. By default, the label is constructed by traversing all the children and accumulating all the `Text` nodes separated by space.

| Type   | Required |
| ------ | -------- |
| string | No       |

---

### `accessibilityHint`

An accessibility hint helps users understand what will happen when they perform an action on the accessibility element when that result is not clear from the accessibility label.

| Type   | Required |
| ------ | -------- |
| string | No       |

---

### `accessibilityRole`

`accessibilityRole` communicates the purpose of a component to the user of an assistive technology.

`accessibilityRole` can be one of the following:

- `'none'` - Used when the element has no role.
- `'button'` - Used when the element should be treated as a button.
- `'link'` - Used when the element should be treated as a link.
- `'search'` - Used when the text field element should also be treated as a search field.
- `'image'` - Used when the element should be treated as an image. Can be combined with button or link, for example.
- `'keyboardkey'` - Used when the element acts as a keyboard key.
- `'text'` - Used when the element should be treated as static text that cannot change.
- `'adjustable'` - Used when an element can be "adjusted" (e.g. a slider).
- `'imagebutton'` - Used when the element should be treated as a button and is also an image.
- `'header'` - Used when an element acts as a header for a content section (e.g. the title of a navigation bar).
- `'summary'` - Used when an element can be used to provide a quick summary of current conditions in the app when the app first launches.
- `'alert'` - Used when an element contains important text to be presented to the user.
- `'checkbox'` - Used when an element represents a checkbox which can be checked, unchecked, or have mixed checked state.
- `'combobox'` - Used when an element represents a combo box, which allows the user to select among several choices.
- `'menu'` - Used when the component is a menu of choices.
- `'menubar'` - Used when a component is a container of multiple menus.
- `'menuitem'` - Used to represent an item within a menu.
- `'progressbar'` - Used to represent a component which indicates progress of a task.
- `'radio'` - Used to represent a radio button.
- `'radiogroup'` - Used to represent a group of radio buttons.
- `'scrollbar'` - Used to represent a scroll bar.
- `'spinbutton'` - Used to represent a button which opens a list of choices.
- `'switch'` - Used to represent a switch which can be turned on and off.
- `'tab'` - Used to represent a tab.
- `'tablist'` - Used to represent a list of tabs.
- `'timer'` - Used to represent a timer.
- `'toolbar'` - Used to represent a tool bar (a container of action buttons or components).

| Type   | Required |
| ------ | -------- |
| string | No       |

---

### `accessibilityState`

Describes the current state of a component to the user of an assistive technology.

See the [Accessibility guide](https://reactnative.dev/docs/0.64/accessibility#accessibilitystate-ios-android) for more information.

| Type                                                                                                           | Required |
|----------------------------------------------------------------------------------------------------------------| -------- |
| object: &lbrace; disabled: bool, selected: bool, checked: bool or 'mixed', busy: bool, expanded: bool &rbrace; | No       |

---

### `accessibilityActions`

Accessibility actions allow an assistive technology to programmatically invoke the actions of a component. The `accessibilityActions` property should contain a list of action objects. Each action object should contain the field name and label.

See the [Accessibility guide](https://reactnative.dev/docs/0.64/accessibility#accessibility-actions) for more information.

| Type  | Required |
| ----- | -------- |
| array | No       |

---

### `onAccessibilityAction`

Invoked when the user performs the accessibility actions. The only argument to this function is an event containing the name of the action to perform.

See the [Accessibility guide](https://reactnative.dev/docs/0.64/accessibility#accessibility-actions) for more information.

| Type     | Required |
| -------- | -------- |
| function | No       |

---

### `accessibilityValue`

Represents the current value of a component. It can be a textual description of a component's value, or for range-based components, such as sliders and progress bars, it contains range information (minimum, current, and maximum).

See the [Accessibility guide](https://reactnative.dev/docs/0.64/accessibility#accessibilityvalue-ios-android) for more information.

| Type                                                                          | Required |
|-------------------------------------------------------------------------------| -------- |
| object: &lbrace; min: number, max: number, now: number, text: string &rbrace; | No       |

---

### `delayLongPress`

Duration (in milliseconds) from `onPressIn` before `onLongPress` is called.

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `delayPressIn`

Duration (in milliseconds), from the start of the touch, before `onPressIn` is called.

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `delayPressOut`

Duration (in milliseconds), from the release of the touch, before `onPressOut` is called.

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `disabled`

If true, disable all interactions for this component.

| Type | Required |
| ---- | -------- |
| bool | No       |

---

### `hitSlop`

This defines how far your touch can start away from the button. This is added to `pressRetentionOffset` when moving off of the button.

> The touch area never extends past the parent view bounds and the Z-index of sibling views always takes precedence if a touch hits two overlapping views.

| Type                      | Required |
| ------------------------- | -------- |
| [Rect](rect.md) or number | No       |

### `onBlur`

Invoked when the item loses focus.

| Type     | Required |
| -------- | -------- |
| function | No       |

---

### `onFocus`

Invoked when the item receives focus.

| Type     | Required |
| -------- | -------- |
| function | No       |

---

### `onLayout`

Invoked on mount and on layout changes.

| Type                                    | Required |
| --------------------------------------- | -------- |
| ([LayoutEvent](layoutevent.md)) => void | No       |

---

### `onLongPress`

Called if the time after `onPressIn` lasts longer than 370 milliseconds. This time period can be customized with [`delayLongPress`](#delaylongpress).

| Type     | Required |
| -------- | -------- |
| function | No       |

---

### `onPress`

Called when the touch is released, but not if cancelled (e.g. by a scroll that steals the responder lock). The first function argument is an event in form of [PressEvent](pressevent.md).

| Type     | Required |
| -------- | -------- |
| function | No       |

---

### `onPressIn`

Called as soon as the touchable element is pressed and invoked even before onPress. This can be useful when making network requests. The first function argument is an event in form of [PressEvent](pressevent.md).

| Type     | Required |
| -------- | -------- |
| function | No       |

---

### `onPressOut`

Called as soon as the touch is released even before onPress. The first function argument is an event in form of [PressEvent](pressevent.md).

| Type     | Required |
| -------- | -------- |
| function | No       |

---

### `pressRetentionOffset`

When the scroll view is disabled, this defines how far your touch may move off of the button, before deactivating the button. Once deactivated, try moving it back and you'll see that the button is once again reactivated! Move it back and forth several times while the scroll view is disabled. Ensure you pass in a constant to reduce memory allocations.

| Type                      | Required |
| ------------------------- | -------- |
| [Rect](rect.md) or number | No       |

---

### `nativeID`

| Type   | Required |
| ------ | -------- |
| string | No       |

---

### `testID`

Used to locate this view in end-to-end tests.

| Type   | Required |
| ------ | -------- |
| string | No       |

---

### `touchSoundDisabled`

If true, doesn't play a system sound on touch.

| Type    | Required | Platform |
| ------- | -------- | -------- |
| Boolean | No       | Android  |
