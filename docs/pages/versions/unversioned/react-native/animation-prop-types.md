---
id: animation-prop-types
title: Animation Prop Types
---

### Props

- [`animationDelay`](../animation-prop-types/#animationDelay)
- [`animationDirection`](../animation-prop-types/#animationDirection)
- [`animationDuration`](../animation-prop-types/#animationDuration)
- [`animationFillMode`](../animation-prop-types/#animationFillMode)
- [`animationIterationCount`](../animation-prop-types/#animationIterationCount)
- [`animationKeyframes`](../animation-prop-types/#animationKeyframes)
- [`animationPlayState`](../animation-prop-types/#animationPlayState)
- [`animationTimingFunction`](../animation-prop-types/#animationTimingFunction)
- [`transitionDelay`](../animation-prop-types/#transitionDelay)
- [`transitionDuration`](../animation-prop-types/#transitionDuration)
- [`transitionProperty`](../animation-prop-types/#transitionProperty)
- [`transitionTimingFunction`](../animation-prop-types/#transitionTimingFunction)

---

# Reference

## Enums

### `animationDirectionEnum`

| Type                                                        | Platform |
| ----------------------------------------------------------- | -------- |
| enum('alternate', 'alternate-reverse', 'normal', 'reverse') | Web      |

### `animationFillModeEnum`

| Type                                          | Platform |
| --------------------------------------------- | -------- |
| enum('none', 'forwards', 'backwards', 'both') | Web      |

### `animationPlayStateEnum`

| Type                      | Platform |
| ------------------------- | -------- |
| enum('paused', 'running') | Web      |

## Props

### `animationDelay`

| Type                   | Required | Platform |
| ---------------------- | -------- | -------- |
| enum(string, string[]) | No       | Web      |

---

### `animationDirection`

| Type                                                                                                                                                         | Required | Platform |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | -------- |
| enum([animationDirectionEnum](../animation-prop-types/#animationDirectionEnum), [animationDirectionEnum](../animation-prop-types/#animationDirectionEnum)[]) | No       | Web      |

---

### `animationDuration`

| Type                   | Required | Platform |
| ---------------------- | -------- | -------- |
| enum(string, string[]) | No       | Web      |

---

### `animationFillMode`

| Type                                                                                                                                                         | Required | Platform |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | -------- |
| enum([animationFillModeEnum](../animation-prop-types/#animationFillModeEnum), [animationFillModeEnum](<(../animation-prop-types/#animationFillModeEnum)>)[]) | No       | Web      |

---

### `animationIterationCount`

| Type                                             | Required | Platform |
| ------------------------------------------------ | -------- | -------- |
| enum(number, number[], 'infinite', 'infinite'[]) | No       | Web      |

---

### `animationKeyframes`

| Type                                     | Required | Platform |
| ---------------------------------------- | -------- | -------- |
| enum(string, string[], object, object[]) | No       | Web      |

---

### `animationPlayState`

| Type                                                                                                                                                         | Required | Platform |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | -------- |
| enum([animationPlayStateEnum](../animation-prop-types/#animationPlayStateEnum), [animationPlayStateEnum](../animation-prop-types/#animationPlayStateEnum)[]) | No       | Web      |

---

### `animationTimingFunction`

| Type                   | Required | Platform |
| ---------------------- | -------- | -------- |
| enum(string, string[]) | No       | Web      |

---

### `transitionDelay`

| Type                   | Required | Platform |
| ---------------------- | -------- | -------- |
| enum(string, string[]) | No       | Web      |

---

### `transitionDuration`

| Type                   | Required | Platform |
| ---------------------- | -------- | -------- |
| enum(string, string[]) | No       | Web      |

---

### `transitionProperty`

| Type                   | Required | Platform |
| ---------------------- | -------- | -------- |
| enum(string, string[]) | No       | Web      |

---

### `transitionTimingFunction`

| Type                   | Required | Platform |
| ---------------------- | -------- | -------- |
| enum(string, string[]) | No       | Web      |
