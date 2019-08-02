---
id: layoutanimation
title: LayoutAnimation
---

Automatically animates views to their new positions when the next layout happens.

A common way to use this API is to call it before calling `setState`.

Note that in order to get this to work on **Android** you need to set the following flags via `UIManager`:

```java
    UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
```

### Methods

- [`configureNext`](../layoutanimation/#configurenext)
- [`create`](../layoutanimation/#create)
- [`checkConfig`](../layoutanimation/#checkconfig)

### Properties

- [`Types`](../layoutanimation/#types)
- [`Properties`](../layoutanimation/#properties)
- [`Presets`](../layoutanimation/#presets)
- [`easeInEaseOut`](../layoutanimation/#easeineaseout)
- [`linear`](../layoutanimation/#linear)
- [`spring`](../layoutanimation/#spring)

---

# Reference

## Methods

### `configureNext()`

```javascript

static configureNext(config, onAnimationDidEnd?)

```

Schedules an animation to happen on the next layout.

#### Parameters:

| Name              | Type     | Required | Description                                                |
| ----------------- | -------- | -------- | ---------------------------------------------------------- |
| config            | object   | Yes      | See config parameters below.                               |
| onAnimationDidEnd | function | No       | Called when the animation finished. Only supported on iOS. |

##### config

- `duration` in milliseconds
- `create`, config for animating in new views (see `Anim` type)
- `update`, config for animating views that have been updated (see `Anim` type)

---

### `create()`

```javascript

static create(duration, type, creationProp)

```

Helper for creating a config for `configureNext`.

---

### `checkConfig()`

```javascript

static checkConfig(config, location, name)

```

## Properties

---

---

---

---

---
