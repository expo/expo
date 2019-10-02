---
id: switch
title: Switch
---

Renders a boolean input.

This is a controlled component that requires an `onValueChange` callback that updates the `value` prop in order for the component to reflect user actions. If the `value` prop is not updated, the component will continue to render the supplied `value` prop instead of the expected result of any user actions.

### Props

- [View props...](../view/#props)

* [`disabled`](../switch/#disabled)
* [`trackColor`](../switch/#trackcolor)
* [`ios_backgroundColor`](../switch/#ios-backgroundcolor)
* [`onValueChange`](../switch/#onvaluechange)
* [`testID`](../switch/#testid)
* [`thumbColor`](../switch/#thumbcolor)
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

### `trackColor`

Custom colors for the switch track.

_iOS_: When the switch value is false, the track shrinks into the border. If you want to change the color of the background exposed by the shrunken track, use [`ios_backgroundColor`](../switch/#ios_backgroundColor).

| Type                                                            | Required |
| --------------------------------------------------------------- | -------- |
| object: {false: [color](../colors/), true: [color](../colors/)} | No       |

---

### `ios_backgroundColor`

On iOS, custom color for the background. This background color can be seen either when the switch value is false or when the switch is disabled (and the switch is translucent).

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

### `thumbColor`

Color of the foreground switch grip. If this is set on iOS, the switch grip will lose its drop shadow.

| Type                | Required |
| ------------------- | -------- |
| [color](../colors/) | No       |

---

### `tintColor`

> `tintColor` is deprecated, use `trackColor` instead.

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
