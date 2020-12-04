---
id: transforms
title: Transforms
---

# Reference

## Methods

### `decomposedMatrix`

> **Deprecated.** Use the [`transform`](transforms.md#transform) prop instead.

| Type                     | Required |
| ------------------------ | -------- |
| DecomposedMatrixPropType | No       |

---

### `rotation`

| Type                                                                         | Required |
| ---------------------------------------------------------------------------- | -------- |
| deprecatedPropType(ReactPropTypes.number, 'Use the transform prop instead.') | No       |

---

### `scaleX`

| Type                                                                         | Required |
| ---------------------------------------------------------------------------- | -------- |
| deprecatedPropType(ReactPropTypes.number, 'Use the transform prop instead.') | No       |

---

### `scaleY`

| Type                                                                         | Required |
| ---------------------------------------------------------------------------- | -------- |
| deprecatedPropType(ReactPropTypes.number, 'Use the transform prop instead.') | No       |

---

### `transform`

`transform` accepts an array of transformation objects. Each object specifies the property that will be transformed as the key, and the value to use in the transformation. Objects should not be combined. Use a single key/value pair per object.

The rotate transformations require a string so that the transform may be expressed in degrees (deg) or radians (rad). For example:

`transform([{ rotateX: '45deg' }, { rotateZ: '0.785398rad' }])`

The skew transformations require a string so that the transform may be expressed in degrees (deg). For example:

`transform([{ skewX: '45deg' }])`

| Type                                                                                                                                                                                                                                                                                                                                                    | Required |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| array of object: {perspective: number}, ,object: {rotate: string}, ,object: {rotateX: string}, ,object: {rotateY: string}, ,object: {rotateZ: string}, ,object: {scale: number}, ,object: {scaleX: number}, ,object: {scaleY: number}, ,object: {translateX: number}, ,object: {translateY: number}, ,object: {skewX: string}, ,object: {skewY: string} | No       |

---

### `transformMatrix`

> **Deprecated.** Use the [`transform`](transforms.md#transform) prop instead.

| Type                    | Required |
| ----------------------- | -------- |
| TransformMatrixPropType | No       |

---

### `translateX`

| Type                                                                         | Required |
| ---------------------------------------------------------------------------- | -------- |
| deprecatedPropType(ReactPropTypes.number, 'Use the transform prop instead.') | No       |

---

### `translateY`

| Type                                                                         | Required |
| ---------------------------------------------------------------------------- | -------- |
| deprecatedPropType(ReactPropTypes.number, 'Use the transform prop instead.') | No       |
