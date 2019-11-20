---
id: view-style-props
title: View Style Props
---

### Props

- [Layout Props](../layout-props/#props)
- [Shadow Props](../shadow-props/#props)
- [Transforms](../transforms/#props)
- [`borderRightColor`](../view-style-props/#borderrightcolor)
- [`backfaceVisibility`](../view-style-props/#backfacevisibility)
- [`borderBottomColor`](../view-style-props/#borderbottomcolor)
- [`borderBottomEndRadius`](../view-style-props/#borderbottomendradius)
- [`borderBottomLeftRadius`](../view-style-props/#borderbottomleftradius)
- [`borderBottomRightRadius`](../view-style-props/#borderbottomrightradius)
- [`borderBottomStartRadius`](../view-style-props/#borderbottomstartradius)
- [`borderBottomWidth`](../view-style-props/#borderbottomwidth)
- [`borderColor`](../view-style-props/#bordercolor)
- [`borderEndColor`](../view-style-props/#borderendcolor)
- [`borderLeftColor`](../view-style-props/#borderleftcolor)
- [`borderLeftWidth`](../view-style-props/#borderleftwidth)
- [`borderRadius`](../view-style-props/#borderradius)
- [`backgroundColor`](../view-style-props/#backgroundcolor)
- [`borderRightWidth`](../view-style-props/#borderrightwidth)
- [`borderStartColor`](../view-style-props/#borderstartcolor)
- [`borderStyle`](../view-style-props/#borderstyle)
- [`borderTopColor`](../view-style-props/#bordertopcolor)
- [`borderTopEndRadius`](../view-style-props/#bordertopendradius)
- [`borderTopLeftRadius`](../view-style-props/#bordertopleftradius)
- [`borderTopRightRadius`](../view-style-props/#bordertoprightradius)
- [`borderTopStartRadius`](../view-style-props/#bordertopstartradius)
- [`borderTopWidth`](../view-style-props/#bordertopwidth)
- [`borderWidth`](../view-style-props/#borderwidth)
- [`opacity`](../view-style-props/#opacity)
- [`elevation`](../view-style-props/#elevation)

---

# Reference

## Props

### `borderRightColor`

| Type                | Required |
| ------------------- | -------- |
| [color](../colors/) | No       |

---

### `backfaceVisibility`

| Type                      | Required |
| ------------------------- | -------- |
| enum('visible', 'hidden') | No       |

---

### `borderBottomColor`

| Type                | Required |
| ------------------- | -------- |
| [color](../colors/) | No       |

---

### `borderBottomEndRadius`

| Type   | Required |
| ------ | -------- |
| number | No       |

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

### `borderBottomStartRadius`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `borderBottomWidth`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `borderColor`

| Type                | Required |
| ------------------- | -------- |
| [color](../colors/) | No       |

---

### `borderEndColor`

| Type                | Required |
| ------------------- | -------- |
| [color](../colors/) | No       |

---

### `borderLeftColor`

| Type                | Required |
| ------------------- | -------- |
| [color](../colors/) | No       |

---

### `borderLeftWidth`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `borderRadius`

If the rounded border is not visible, try applying `overflow: 'hidden'` as well.

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `backgroundColor`

| Type                | Required |
| ------------------- | -------- |
| [color](../colors/) | No       |

---

### `borderRightWidth`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `borderStartColor`

| Type                | Required |
| ------------------- | -------- |
| [color](../colors/) | No       |

---

### `borderStyle`

| Type                              | Required |
| --------------------------------- | -------- |
| enum('solid', 'dotted', 'dashed') | No       |

---

### `borderTopColor`

| Type                | Required |
| ------------------- | -------- |
| [color](../colors/) | No       |

---

### `borderTopEndRadius`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `borderTopLeftRadius`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `borderTopRightRadius`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `borderTopStartRadius`

| Type   | Required |
| ------ | -------- |
| number | No       |

---

### `borderTopWidth`

| Type   | Required |
| ------ | -------- |
| number | No       |

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

### `elevation`

(Android-only) Sets the elevation of a view, using Android's underlying [elevation API](https://developer.android.com/training/material/shadows-clipping.html#Elevation). This adds a drop shadow to the item and affects z-order for overlapping views. Only supported on Android 5.0+, has no effect on earlier versions.

| Type   | Required | Platform |
| ------ | -------- | -------- |
| number | No       | Android  |
