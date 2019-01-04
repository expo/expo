---
id: image-style-props
title: Image Style Props
---

### Props

* [`borderTopRightRadius`](image-style-props.md#bordertoprightradius)
* [`backfaceVisibility`](image-style-props.md#backfacevisibility)
* [`borderBottomLeftRadius`](image-style-props.md#borderbottomleftradius)
* [`borderBottomRightRadius`](image-style-props.md#borderbottomrightradius)
* [`borderColor`](image-style-props.md#bordercolor)
* [`borderRadius`](image-style-props.md#borderradius)
* [`borderTopLeftRadius`](image-style-props.md#bordertopleftradius)
* [`backgroundColor`](image-style-props.md#backgroundcolor)
* [`borderWidth`](image-style-props.md#borderwidth)
* [`opacity`](image-style-props.md#opacity)
* [`overflow`](image-style-props.md#overflow)
* [`resizeMode`](image-style-props.md#resizemode)
* [`tintColor`](image-style-props.md#tintcolor)
* [`overlayColor`](image-style-props.md#overlaycolor)

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

| Type               | Required |
| ------------------ | -------- |
| [color](colors.md) | No       |

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

| Type               | Required |
| ------------------ | -------- |
| [color](colors.md) | No       |

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

| Type                         | Required |
| ---------------------------- | -------- |
| Object.keys(ImageResizeMode) | No       |

---

### `tintColor`

Changes the color of all the non-transparent pixels to the tintColor.

| Type               | Required |
| ------------------ | -------- |
| [color](colors.md) | No       |

---

### `overlayColor`

When the image has rounded corners, specifying an overlayColor will cause the remaining space in the corners to be filled with a solid color. This is useful in cases which are not supported by the Android implementation of rounded corners:

* Certain resize modes, such as 'contain'
* Animated GIFs

A typical way to use this prop is with images displayed on a solid background and setting the `overlayColor` to the same color as the background.

For details of how this works under the hood, see http://frescolib.org/rounded-corners-and-circles.md

| Type   | Required | Platform |
| ------ | -------- | -------- |
| string | No       | Android  |

