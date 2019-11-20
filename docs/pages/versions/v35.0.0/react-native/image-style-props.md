---
id: image-style-props
title: Image Style Props
---

### Props

- [`borderTopRightRadius`](../image-style-props/#bordertoprightradius)
- [`backfaceVisibility`](../image-style-props/#backfacevisibility)
- [`borderBottomLeftRadius`](../image-style-props/#borderbottomleftradius)
- [`borderBottomRightRadius`](../image-style-props/#borderbottomrightradius)
- [`borderColor`](../image-style-props/#bordercolor)
- [`borderRadius`](../image-style-props/#borderradius)
- [`borderTopLeftRadius`](../image-style-props/#bordertopleftradius)
- [`backgroundColor`](../image-style-props/#backgroundcolor)
- [`borderWidth`](../image-style-props/#borderwidth)
- [`opacity`](../image-style-props/#opacity)
- [`overflow`](../image-style-props/#overflow)
- [`resizeMode`](../image-style-props/#resizemode)
- [`tintColor`](../image-style-props/#tintcolor)
- [`overlayColor`](../image-style-props/#overlaycolor)

---

# Reference

## Props

### `borderTopRightRadius`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `backfaceVisibility`

| Type                      | Required |
| ------------------------- | -------- |
| enum('visible', 'hidden') | No       |

---

### `borderBottomLeftRadius`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `borderBottomRightRadius`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `borderColor`

| Type                | Required |
| ------------------- | -------- |
| [color](../colors/) | No       |

---

### `borderRadius`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `borderTopLeftRadius`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `backgroundColor`

| Type                | Required |
| ------------------- | -------- |
| [color](../colors/) | No       |

---

### `borderWidth`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `opacity`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `overflow`

| Type                      | Required |
| ------------------------- | -------- |
| enum('visible', 'hidden') | No       |

---

### `resizeMode`

| Type                                                    | Required |
| ------------------------------------------------------- | -------- |
| enum('cover', 'contain', 'stretch', 'repeat', 'center') | No       |

---

### `tintColor`

Changes the color of all the non-transparent pixels to the tintColor.

| Type                | Required |
| ------------------- | -------- |
| [color](../colors/) | No       |

---

### `overlayColor`

When the image has rounded corners, specifying an overlayColor will cause the remaining space in the corners to be filled with a solid color. This is useful in cases which are not supported by the Android implementation of rounded corners:

- Certain resize modes, such as 'contain'
- Animated GIFs

A typical way to use this prop is with images displayed on a solid background and setting the `overlayColor` to the same color as the background.

For details of how this works under the hood, see https://frescolib.org/docs/rounded-corners-and-circles.html

| Type   | Required | Platform |
| ------ | -------- | -------- |
| string | No       | Android  |
