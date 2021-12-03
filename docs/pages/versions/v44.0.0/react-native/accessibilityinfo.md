---
id: accessibilityinfo
title: AccessibilityInfo
---

Sometimes it's useful to know whether or not the device has a screen reader that is currently active. The `AccessibilityInfo` API is designed for this purpose. You can use it to query the current state of the screen reader as well as to register to be notified when the state of the screen reader changes.

## Example

```js
import React, { useState, useEffect } from 'react';
import { AccessibilityInfo, View, Text, StyleSheet } from 'react-native';

const App = () => {
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.addEventListener('reduceMotionChanged', handleReduceMotionToggled);
    AccessibilityInfo.addEventListener('screenReaderChanged', handleScreenReaderToggled);

    AccessibilityInfo.isReduceMotionEnabled().then(reduceMotionEnabled => {
      setReduceMotionEnabled(reduceMotionEnabled);
    });
    AccessibilityInfo.isScreenReaderEnabled().then(screenReaderEnabled => {
      setScreenReaderEnabled(screenReaderEnabled);
    });

    return () => {
      AccessibilityInfo.removeEventListener('reduceMotionChanged', handleReduceMotionToggled);
      AccessibilityInfo.removeEventListener('screenReaderChanged', handleScreenReaderToggled);
    };
  }, []);

  const handleReduceMotionToggled = reduceMotionEnabled => {
    setReduceMotionEnabled(reduceMotionEnabled);
  };

  const handleScreenReaderToggled = screenReaderEnabled => {
    setScreenReaderEnabled(screenReaderEnabled);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.status}>
        The reduce motion is {reduceMotionEnabled ? 'enabled' : 'disabled'}.
      </Text>
      <Text style={styles.status}>
        The screen reader is {screenReaderEnabled ? 'enabled' : 'disabled'}.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    margin: 30,
  },
});

export default App;
```

---

# Reference

## Methods

### `addEventListener()`

```js
static addEventListener(eventName, handler)
```

Add an event handler. Supported events:

| Event name                                     | Description                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `announcementFinished` <br/> **iOS-only**      | Fires when the screen reader has finished making an announcement. The argument to the event handler is a dictionary with these keys:<ul><li>`announcement`: The string announced by the screen reader.</li><li>`success`: A boolean indicating whether the announcement was successfully made.</li></ul> |
| `boldTextChanged` <br/> **iOS-only**           | Fires when the state of the bold text toggle changes. The argument to the event handler is a boolean. The boolean is `true` when bold text is enabled and `false` otherwise.                                                                                                                             |
| `grayscaleChanged` <br/> **iOS-only**          | Fires when the state of the gray scale toggle changes. The argument to the event handler is a boolean. The boolean is `true` when a gray scale is enabled and `false` otherwise.                                                                                                                         |
| `invertColorsChanged` <br/> **iOS-only**       | Fires when the state of the invert colors toggle changes. The argument to the event handler is a boolean. The boolean is `true` when invert colors is enabled and `false` otherwise.                                                                                                                     |
| `reduceMotionChanged`                          | Fires when the state of the reduce motion toggle changes. The argument to the event handler is a boolean. The boolean is `true` when a reduce motion is enabled (or when "Transition Animation Scale" in "Developer options" is "Animation off") and `false` otherwise.                                  |
| `reduceTransparencyChanged` <br/> **iOS-only** | Fires when the state of the reduce transparency toggle changes. The argument to the event handler is a boolean. The boolean is `true` when reduce transparency is enabled and `false` otherwise.                                                                                                         |
| `screenReaderChanged`                          | Fires when the state of the screen reader changes. The argument to the event handler is a boolean. The boolean is `true` when a screen reader is enabled and `false` otherwise.                                                                                                                          |

### `announceForAccessibility()`

```js
static announceForAccessibility(announcement)
```

Post a string to be announced by the screen reader.

### `isBoldTextEnabled()` **(iOS)**

```js
static isBoldTextEnabled()
```

Query whether a bold text is currently enabled. Returns a promise which resolves to a boolean. The result is `true` when bold text is enabled and `false` otherwise.

### `isGrayscaleEnabled()` **(iOS)**

```js
static isGrayscaleEnabled()
```

Query whether grayscale is currently enabled. Returns a promise which resolves to a boolean. The result is `true` when grayscale is enabled and `false` otherwise.

### `isInvertColorsEnabled()` **(iOS)**

```js
static isInvertColorsEnabled()
```

Query whether invert colors is currently enabled. Returns a promise which resolves to a boolean. The result is `true` when invert colors is enabled and `false` otherwise.

### `isReduceMotionEnabled()`

```js
static isReduceMotionEnabled()
```

Query whether reduce motion is currently enabled. Returns a promise which resolves to a boolean. The result is `true` when reduce motion is enabled and `false` otherwise.

### `isReduceTransparencyEnabled()` **(iOS)**

```js
static isReduceTransparencyEnabled()
```

Query whether reduce transparency is currently enabled. Returns a promise which resolves to a boolean. The result is `true` when a reduce transparency is enabled and `false` otherwise.

### `isScreenReaderEnabled()`

```js
static isScreenReaderEnabled()
```

Query whether a screen reader is currently enabled. Returns a promise which resolves to a boolean. The result is `true` when a screen reader is enabled and `false` otherwise.

### `removeEventListener()`

```js
static removeEventListener(eventName, handler)
```

Remove an event handler.

### `setAccessibilityFocus()`

```js
static setAccessibilityFocus(reactTag)
```

Set accessibility focus to a React component.

On Android, this calls `UIManager.sendAccessibilityEvent` method with passed `reactTag` and `UIManager.AccessibilityEventTypes.typeViewFocused` arguments.

> **Note**: Make sure that any `View` you want to receive the accessibility focus has `accessible={true}`.
