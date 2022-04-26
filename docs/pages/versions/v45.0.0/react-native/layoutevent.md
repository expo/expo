---
id: layoutevent
title: LayoutEvent Object Type
---

`LayoutEvent` object is returned in the callback as a result of component layout change, for example `onLayout` in [View](view.md) component.

## Example

```js
{
  layout: {
    width: 520,
    height: 70.5,
    x: 0,
    y: 42.5
  },
  target: 1127
}
```

## Keys and values

### `height`

Height of the component after the layout changes.

| Type   | Optional |
| ------ | -------- |
| number | No       |

### `width`

Width of the component after the layout changes.

| Type   | Optional |
| ------ | -------- |
| number | No       |

### `x`

Component X coordinate inside the parent component.

| Type   | Optional |
| ------ | -------- |
| number | No       |

### `y`

Component Y coordinate inside the parent component.

| Type   | Optional |
| ------ | -------- |
| number | No       |

### `target`

The node id of the element receiving the PressEvent.

| Type                        | Optional |
| --------------------------- | -------- |
| number, `null`, `undefined` | No       |

## Used by

- [`Image`](image.md)
- [`Pressable`](pressable.md)
- [`ScrollView`](scrollview.md)
- [`Text`](text.md)
- [`TextInput`](textinput.md)
- [`TouchableWithoutFeedback`](touchablewithoutfeedback.md)
- [`View`](view.md)
