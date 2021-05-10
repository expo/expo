---
id: touchablenativefeedback
title: TouchableNativeFeedback
---

A wrapper for making views respond properly to touches (Android only). On Android this component uses native state drawable to display touch feedback.

At the moment it only supports having a single View instance as a child node, as it's implemented by replacing that View with another instance of RCTView node with some additional properties set.

Background drawable of native feedback touchable can be customized with `background` property.

Example:

```jsx

renderButton: function() {
  return (
    <TouchableNativeFeedback
        onPress={this._onPressButton}
        background={TouchableNativeFeedback.SelectableBackground()}>
      <View style={{width: 150, height: 100, backgroundColor: 'red'}}>
        <Text style={{margin: 30}}>Button</Text>
      </View>
    </TouchableNativeFeedback>
  );
},

```

---

# Reference

## Props

Inherits [TouchableWithoutFeedback Props](touchablewithoutfeedback.md#props).

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

| Type | Required | Platform |
| ---- | -------- | -------- |
| bool | No       | Android  |

---

### `nextFocusForward`

TV next focus forward (see documentation for the View component).

| Type | Required | Platform |
| ---- | -------- | -------- |
| bool | No       | Android  |

---

### `nextFocusLeft`

TV next focus left (see documentation for the View component).

| Type | Required | Platform |
| ---- | -------- | -------- |
| bool | No       | Android  |

---

### `nextFocusRight`

TV next focus right (see documentation for the View component).

| Type | Required | Platform |
| ---- | -------- | -------- |
| bool | No       | Android  |

---

### `nextFocusUp`

TV next focus up (see documentation for the View component).

| Type | Required | Platform |
| ---- | -------- | -------- |
| bool | No       | Android  |

## Methods

### `SelectableBackground()`

```jsx

static SelectableBackground()

```

Creates an object that represents android theme's default background for selectable elements (?android:attr/selectableItemBackground).

---

### `SelectableBackgroundBorderless()`

```jsx

static SelectableBackgroundBorderless()

```

Creates an object that represent android theme's default background for borderless selectable elements (?android:attr/selectableItemBackgroundBorderless). Available on android API level 21+.

---

### `Ripple()`

```jsx

static Ripple(color: string, borderless: boolean)

```

Creates an object that represents ripple drawable with specified color (as a string). If property `borderless` evaluates to true the ripple will render outside of the view bounds (see native actionbar buttons as an example of that behavior). This background type is available on Android API level 21+.

**Parameters:**

| Name       | Type    | Required | Description                                 |
| ---------- | ------- | -------- | ------------------------------------------- |
| color      | string  | Yes      | The ripple color                            |
| borderless | boolean | Yes      | If the ripple can render outside its bounds |

---

### `canUseNativeForeground()`

```jsx

static canUseNativeForeground()

```
