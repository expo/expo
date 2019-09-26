---
id: toastandroid
title: ToastAndroid
---

This exposes the native ToastAndroid module as a JS module. This has a function 'show' which takes the following parameters:

1. String message: A string with the text to toast
2. int duration: The duration of the toast. May be ToastAndroid.SHORT or ToastAndroid.LONG

There is also a function `showWithGravity` to specify the layout gravity. May be ToastAndroid.TOP, ToastAndroid.BOTTOM, ToastAndroid.CENTER.

The 'showWithGravityAndOffset' function adds on the ability to specify offset These offset values will translate to pixels.

Basic usage:

```javascript
ToastAndroid.show('A pikachu appeared nearby !', ToastAndroid.SHORT);
ToastAndroid.showWithGravity(
  'All Your Base Are Belong To Us',
  ToastAndroid.SHORT,
  ToastAndroid.CENTER
);
ToastAndroid.showWithGravityAndOffset(
  'A wild toast appeared!',
  ToastAndroid.LONG,
  ToastAndroid.BOTTOM,
  25,
  50
);
```

### Methods

- [`show`](../toastandroid/#show)
- [`showWithGravity`](../toastandroid/#showwithgravity)
- [`showWithGravityAndOffset`](../toastandroid/#showwithgravityandoffset)

### Properties

- [`SHORT`](../toastandroid/#short)
- [`LONG`](../toastandroid/#long)
- [`TOP`](../toastandroid/#top)
- [`BOTTOM`](../toastandroid/#bottom)
- [`CENTER`](../toastandroid/#center)

---

# Reference

## Methods

### `show()`

```javascript

static show(message, duration)

```

---

### `showWithGravity()`

```javascript

static showWithGravity(message, duration, gravity)

```

---

### `showWithGravityAndOffset()`

```javascript

static showWithGravityAndOffset(message, duration, gravity, xOffset, yOffset)

```

## Properties

### `SHORT`

```javascript
ToastAndroid.SHORT;
```

---

### `LONG`

```javascript
ToastAndroid.LONG;
```

---

### `TOP`

```javascript
ToastAndroid.TOP;
```

---

### `BOTTOM`

```javascript
ToastAndroid.BOTTOM;
```

---

### `CENTER`

```javascript
ToastAndroid.CENTER;
```
