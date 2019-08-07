---
id: touchablewithoutfeedback
title: TouchableWithoutFeedback
---

Do not use unless you have a very good reason. All elements that respond to press should have a visual feedback when touched.

`TouchableWithoutFeedback` supports only one child. If you wish to have several child components, wrap them in a View. Importantly, `TouchableWithoutFeedback` works by cloning its child and applying responder props to it. It is therefore required that any intermediary components pass through those props to the underlying React Native component.

### Usage Example

```javascript
function MyComponent(props) {
  return (
    <View {...props} style={{ flex: 1, backgroundColour: '#fff' }}>
      <Text>My Component</Text>
    </View>
  );
}

<TouchableWithoutFeedback onPress={() => alert('Pressed!')}>
  <MyComponent />
</TouchableWithoutFeedback>;
```

### Props

- [`accessibilityComponentType`](../touchablewithoutfeedback/#accessibilitycomponenttype)
- [`accessibilityHint`](../touchablewithoutfeedback/#accessibilityhint)
- [`accessibilityLabel`](../touchablewithoutfeedback/#accessibilitylabel)
- [`accessibilityRole`](../view/#accessibilityrole)
- [`accessibilityStates`](../view/#accessibilitystates)
- [`accessibilityTraits`](../touchablewithoutfeedback/#accessibilitytraits)
- [`accessible`](../touchablewithoutfeedback/#accessible)
- [`delayLongPress`](../touchablewithoutfeedback/#delaylongpress)
- [`delayPressIn`](../touchablewithoutfeedback/#delaypressin)
- [`delayPressOut`](../touchablewithoutfeedback/#delaypressout)
- [`disabled`](../touchablewithoutfeedback/#disabled)
- [`hitSlop`](../touchablewithoutfeedback/#hitslop)
- [`onBlur`](../touchablewithoutfeedback/#onblur)
- [`onFocus`](../touchablewithoutfeedback/#onfocus)
- [`onLayout`](../touchablewithoutfeedback/#onlayout)
- [`onLongPress`](../touchablewithoutfeedback/#onlongpress)
- [`onPress`](../touchablewithoutfeedback/#onpress)
- [`onPressIn`](../touchablewithoutfeedback/#onpressin)
- [`onPressOut`](../touchablewithoutfeedback/#onpressout)
- [`pressRetentionOffset`](../touchablewithoutfeedback/#pressretentionoffset)
- [`testID`](../touchablewithoutfeedback/#testid)

### Type Definitions

- [`Event`](../touchablewithoutfeedback/#event)

---

# Reference

## Props

### accessibilityComponentType

_> Note: `accessibilityComponentType`will soon be deprecated. When possible, use `accessibilityRole` and `accessibilityStates` instead._

| Type                        | Required |
| --------------------------- | -------- |
| AccessibilityComponentTypes | No       |

---

### accessibilityHint

An accessibility hint helps users understand what will happen when they perform an action on the accessibility element when that result is not obvious from the accessibility label.

| Type   | Required |
| ------ | -------- |
| string | No       |

---

### accessibilityLabel

Overrides the text that's read by the screen reader when the user interacts with the element. By default, the label is constructed by traversing all the children and accumulating all the `Text` nodes separated by space.

| Type   | Required |
| ------ | -------- |
| string | No       |

---

### accessibilityRole

| Type               | Required |
| ------------------ | -------- |
| AccessibilityRoles | No       |

---

### accessibilityStates

| Type                         | Required |
| ---------------------------- | -------- |
| array of AccessibilityStates | No       |

---

### accessibilityTraits

_> Note: `accessibilityTraits`will soon be deprecated. When possible, use `accessibilityRole` and `accessibilityStates` instead._

| Type                                               | Required |
| -------------------------------------------------- | -------- |
| AccessibilityTraits, ,array of AccessibilityTraits | No       |

---

### accessible

| Type | Required |
| ---- | -------- |
| bool | No       |

---

### delayLongPress

Delay in ms, from onPressIn, before onLongPress is called.

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### delayPressIn

Delay in ms, from the start of the touch, before onPressIn is called.

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### delayPressOut

Delay in ms, from the release of the touch, before onPressOut is called.

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### disabled

If true, disable all interactions for this component.

| Type | Required |
| ---- | -------- |
| bool | No       |

---

### hitSlop

This defines how far your touch can start away from the button. This is added to `pressRetentionOffset` when moving off of the button. ** NOTE ** The touch area never extends past the parent view bounds and the Z-index of sibling views always takes precedence if a touch hits two overlapping views.

| Type                                                               | Required |
| ------------------------------------------------------------------ | -------- |
| object: {top: number, left: number, bottom: number, right: number} | No       |

### onBlur

Invoked when the item loses focus.

| Type     | Required |
| -------- | -------- |
| function | No       |

---

### onFocus

Invoked when the item receives focus.

| Type     | Required |
| -------- | -------- |
| function | No       |

---

### onLayout

Invoked on mount and layout changes with

`{nativeEvent: {layout: {x, y, width, height}}}`

| Type     | Required |
| -------- | -------- |
| function | No       |

---

### onLongPress

| Type     | Required |
| -------- | -------- |
| function | No       |

---

### onPress

Called when the touch is released, but not if cancelled (e.g. by a scroll that steals the responder lock).

| Type     | Required |
| -------- | -------- |
| function | No       |

---

### onPressIn

Called as soon as the touchable element is pressed and invoked even before onPress. This can be useful when making network requests.

| Type     | Required |
| -------- | -------- |
| function | No       |

---

### onPressOut

Called as soon as the touch is released even before onPress.

| Type     | Required |
| -------- | -------- |
| function | No       |

---

### pressRetentionOffset

When the scroll view is disabled, this defines how far your touch may move off of the button, before deactivating the button. Once deactivated, try moving it back and you'll see that the button is once again reactivated! Move it back and forth several times while the scroll view is disabled. Ensure you pass in a constant to reduce memory allocations.

| Type                                                               | Required |
| ------------------------------------------------------------------ | -------- |
| object: {top: number, left: number, bottom: number, right: number} | No       |

### testID

Used to locate this view in end-to-end tests.

| Type   | Required |
| ------ | -------- |
| string | No       |

---

## Type Definitions

### Event

| Type   |
| ------ |
| Object |
