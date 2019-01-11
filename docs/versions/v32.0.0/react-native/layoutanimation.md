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

* [`configureNext`](layoutanimation.md#configurenext)
* [`create`](layoutanimation.md#create)
* [`checkConfig`](layoutanimation.md#checkconfig)

### Properties

* [`Types`](layoutanimation.md#types)
* [`Properties`](layoutanimation.md#properties)
* [`Presets`](layoutanimation.md#presets)
* [`easeInEaseOut`](layoutanimation.md#easeineaseout)
* [`linear`](layoutanimation.md#linear)
* [`spring`](layoutanimation.md#spring)

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

* `duration` in milliseconds
* `create`, config for animating in new views (see `Anim` type)
* `update`, config for animating views that have been updated (see `Anim` type)

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

### Types

An enumerate of animation types to be used in [`create`](layoutanimation.md#create) method.

| Types         |
| ------------- |
| spring        |
| linear        |
| easeInEaseOut |
| easeIn        |
| easeOut       |
| keyboard      |

---

### Properties

An enumerate of object property to be animated, used in [`create`](layoutanimation.md#create) method.

| Properties |
| ---------- |
| opacity    |
| scaleX     |
| scaleY     |
| scaleXY    |

---

### Presets

A set of predefined animation config.

| Presets       | Value                                                                                                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| easeInEaseOut | `create(300, 'easeInEaseOut', 'opacity')`                                                                                                                             |
| linear        | `create(500, 'linear', 'opacity')`                                                                                                                                    |
| spring        | `{ duration: 700, create: { type: 'linear', property: 'opacity' }, update: { type: 'spring', springDamping: 0.4 }, delete: { type: 'linear', property: 'opacity' } }` |

---

### easeInEaseOut

Shortcut to bind `configureNext()` methods with `Presets.easeInEaseOut`.

---

### linear

Shortcut to bind `configureNext()` methods with `Presets.linear`.

---

### spring

Shortcut to bind `configureNext()` methods with `Presets.spring`.

