---
id: switch
title: Switch
---

Renders a boolean input.

This is a controlled component that requires an `onValueChange` callback that updates the `value` prop in order for the component to reflect user actions. If the `value` prop is not updated, the component will continue to render the supplied `value` prop instead of the expected result of any user actions.

@keyword checkbox @keyword toggle

### Props

- [View props...](../view/#props)

* [`disabled`](../switch/#disabled)
* [`onTintColor`](../switch/#ontintcolor)
* [`onValueChange`](../switch/#onvaluechange)
* [`testID`](../switch/#testid)
* [`thumbTintColor`](../switch/#thumbtintcolor)
* [`tintColor`](../switch/#tintcolor)
* [`value`](../switch/#value)

---

# Reference

## Props

### `disabled`

If true the user won't be able to toggle the switch. Default value is false.

| Type | Required |
| ---- | -------- |
| bool | No       |

---

### `onTintColor`

Background color when the switch is turned on.

| Type                | Required |
| ------------------- | -------- |
| [color](../colors/) | No       |

---

### `onValueChange`

Invoked with the new value when the value changes.

| Type     | Required |
| -------- | -------- |
| function | No       |

---

### `testID`

Used to locate this view in end-to-end tests.

| Type   | Required |
| ------ | -------- |
| string | No       |

---

### `thumbTintColor`

Color of the foreground switch grip. If this is set on iOS, the switch grip will lose its drop shadow.

| Type                | Required |
| ------------------- | -------- |
| [color](../colors/) | No       |

---

### `tintColor`

Border color on iOS and background color on Android when the switch is turned off.

| Type                | Required |
| ------------------- | -------- |
| [color](../colors/) | No       |

---

### `value`

The value of the switch. If true the switch will be turned on. Default value is false.

| Type | Required |
| ---- | -------- |
| bool | No       |
