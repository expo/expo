---
id: vibration
title: Vibration
---

The Vibration API is exposed at `Vibration.vibrate()`. The vibration is asynchronous so this method will return immediately.

There will be no effect on devices that do not support Vibration, eg. the simulator.

**Note for Android:** add the `VIBRATE` permission under the `"android"` field in your `app.json` file:

```javascript
{
  "android": {
    "permission": ["VIBRATE"]
  }
}
```

**The vibration duration in iOS is not configurable**, so there are some differences with Android. In Android, if `pattern` is a number, it specifies the vibration duration in ms. If `pattern` is an array, those odd indices are the vibration duration, while the even ones are the separation time.

In iOS, invoking `vibrate(duration)` will just ignore the duration and vibrate for a fixed time. While the `pattern` array is used to define the duration between each vibration. See below example for more.

Repeatable vibration is also supported, the vibration will repeat with defined pattern until `cancel()` is called.

Example:

```javascript
const DURATION = 10000;
const PATTERN = [1000, 2000, 3000];

Vibration.vibrate(DURATION);
// Android: vibrate for 10s
// iOS: duration is not configurable, vibrate for fixed time (about 500ms)

Vibration.vibrate(PATTERN);
// Android: wait 1s -> vibrate 2s -> wait 3s
// iOS: wait 1s -> vibrate -> wait 2s -> vibrate -> wait 3s -> vibrate

Vibration.vibrate(PATTERN, true);
// Android: wait 1s -> vibrate 2s -> wait 3s -> wait 1s -> vibrate 2s -> wait 3s -> ...
// iOS: wait 1s -> vibrate -> wait 2s -> vibrate -> wait 3s -> vibrate -> wait 1s -> vibrate -> wait 2s -> vibrate -> wait 3s -> vibrate -> ...

Vibration.cancel();
// Android: vibration stopped
// iOS: vibration stopped
```

### Methods

- [`vibrate`](../vibration/#vibrate)
- [`cancel`](../vibration/#cancel)

---

# Reference

## Methods

### `vibrate()`

```javascript

Vibration.vibrate(pattern: number, Array<number>, repeat: boolean)

```

Trigger a vibration with specified `pattern`.

**Parameters:**

| Name    | Type                      | Required | Description                                                                  |
| ------- | ------------------------- | -------- | ---------------------------------------------------------------------------- |
| pattern | number or Array\<number\> | Yes      | Vibration pattern, accept a number or an array of numbers. Default to 400ms. |
| repeat  | boolean                   | No       | Repeat vibration pattern until cancel(), default to false.                   |

---

### `cancel()`

```javascript
Vibration.cancel();
```

Stop vibration.

```javascript
Vibration.cancel();
```
