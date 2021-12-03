---
id: pressevent
title: PressEvent Object Type
---

`PressEvent` object is returned in the callback as a result of user press interaction, for example `onPress` in [Button](button.md) component.

## Example

```js
{
  changedTouches: [PressEvent],
  identifier: 1,
  locationX: 8,
  locationY: 4.5,
  pageX: 24,
  pageY: 49.5,
  target: 1127,
  timestamp: 85131876.58868201,
  touches: []
}
```

## Keys and values

### `changedTouches`

Array of all PressEvents that have changed since the last event.

| Type                 | Optional |
| -------------------- | -------- |
| array of PressEvents | No       |

### `force` **(iOS)**

Amount of force used during the 3D Touch press. Returns the float value in range from `0.0` to `1.0`.

| Type   | Optional |
| ------ | -------- |
| number | Yes      |

### `identifier`

Unique numeric identifier assigned to the event.

| Type   | Optional |
| ------ | -------- |
| number | No       |

### `locationX`

Touch origin X coordinate inside touchable area (relative to the element).

| Type   | Optional |
| ------ | -------- |
| number | No       |

### `locationY`

Touch origin Y coordinate inside touchable area (relative to the element).

| Type   | Optional |
| ------ | -------- |
| number | No       |

### `pageX`

Touch origin X coordinate on the screen (relative to the root view).

| Type   | Optional |
| ------ | -------- |
| number | No       |

### `pageY`

Touch origin Y coordinate on the screen (relative to the root view).

| Type   | Optional |
| ------ | -------- |
| number | No       |

### `target`

The node id of the element receiving the PressEvent.

| Type                        | Optional |
| --------------------------- | -------- |
| number, `null`, `undefined` | No       |

### `timestamp`

Timestamp value when a PressEvent occurred. Value is represented in milliseconds.

| Type   | Optional |
| ------ | -------- |
| number | No       |

### `touches`

Array of all current PressEvents on the screen.

| Type                 | Optional |
| -------------------- | -------- |
| array of PressEvents | No       |

## Used by

- [`Button`](button.md)
- [`PanResponder`](panresponder.md)
- [`Pressable`](pressable.md)
- [`ScrollView`](scrollview.md)
- [`Text`](text.md)
- [`TextInput`](textinput.md)
- [`TouchableHighlight`](touchablenativefeedback.md)
- [`TouchableOpacity`](touchablewithoutfeedback.md)
- [`TouchableNativeFeedback`](touchablenativefeedback.md)
- [`TouchableWithoutFeedback`](touchablewithoutfeedback.md)
- [`View`](view.md)
