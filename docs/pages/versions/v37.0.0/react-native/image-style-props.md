---
id: image-style-props
title: Image Style Props
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

| Type                | Required |
| ------------------- | -------- |
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

| Type                                                    | Required |
| ------------------------------------------------------- | -------- |
| enum('cover', 'contain', 'stretch', 'repeat', 'center') | No       |

---

### `tintColor`

Changes the color of all the non-transparent pixels to the tintColor.

| Type                | Required |
| ------------------- | -------- |
| [color](colors.md) | No       |

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
