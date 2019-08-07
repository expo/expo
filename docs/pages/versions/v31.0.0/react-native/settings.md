---
id: settings
title: Settings
---

`Settings` serves as a wrapper for [`NSUserDefaults`](https://developer.apple.com/documentation/foundation/nsuserdefaults), a persistent key-value store available only on iOS.

### Methods

- [`get`](../settings/#get)
- [`set`](../settings/#set)
- [`watchKeys`](../settings/#watchkeys)
- [`clearWatch`](../settings/#clearwatch)

---

# Reference

## Methods

### `get()`

```javascript

static get(key)

```

Get the current value for a key in `NSUserDefaults`.

---

### `set()`

```javascript

static set(settings)

```

Set one or more values in `NSUserDefaults`.

---

### `watchKeys()`

```javascript

static watchKeys(keys, callback)

```

Subscribe to be notified when the value for any of the keys specified by the `keys` array changes in `NSUserDefaults`. Returns a `watchId` number that may be used with `clearWatch()` to unsubscribe.

---

### `clearWatch()`

```javascript

static clearWatch(watchId)

```

`watchId` is the number returned by `watchKeys()` when the subscription was originally configured.
