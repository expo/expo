---
id: accessibilityinfo
title: AccessibilityInfo
---

Sometimes it's useful to know whether or not the device has a screen reader that is currently active. The `AccessibilityInfo` API is designed for this purpose. You can use it to query the current state of the screen reader as well as to register to be notified when the state of the screen reader changes.

Here's a small example illustrating how to use `AccessibilityInfo`:

```javascript
class AccessibilityStatusExample extends React.Component {
  state = {
    reduceMotionEnabled: false,
    screenReaderEnabled: false,
  };

  componentDidMount() {
    AccessibilityInfo.addEventListener('reduceMotionChanged', this._handleReduceMotionToggled);
    AccessibilityInfo.addEventListener('screenReaderChanged', this._handleScreenReaderToggled);

    AccessibilityInfo.isReduceMotionEnabled().then(reduceMotionEnabled => {
      this.setState({ reduceMotionEnabled });
    });
    AccessibilityInfo.isScreenReaderEnabled().then(screenReaderEnabled => {
      this.setState({ screenReaderEnabled });
    });
  }

  componentWillUnmount() {
    AccessibilityInfo.removeEventListener('reduceMotionChanged', this._handleReduceMotionToggled);

    AccessibilityInfo.removeEventListener('screenReaderChanged', this._handleScreenReaderToggled);
  }

  _handleReduceMotionToggled = reduceMotionEnabled => {
    this.setState({ reduceMotionEnabled });
  };

  _handleScreenReaderToggled = screenReaderEnabled => {
    this.setState({ screenReaderEnabled });
  };

  render() {
    return (
      <View>
        <Text>The reduce motion is {this.state.reduceMotionEnabled ? 'enabled' : 'disabled'}.</Text>
        <Text>The screen reader is {this.state.screenReaderEnabled ? 'enabled' : 'disabled'}.</Text>
      </View>
    );
  }
}
```

### Methods

- [`isBoldTextEnabled`](../accessibilityinfo/#isBoldTextEnabled)
- [`isGrayscaleEnabled`](../accessibilityinfo/#isGrayscaleEnabled)
- [`isInvertColorsEnabled`](../accessibilityinfo/#isInvertColorsEnabled)
- [`isReduceMotionEnabled`](../accessibilityinfo/#isReduceMotionEnabled)
- [`isReduceTransparencyEnabled`](../accessibilityinfo/#isReduceTransparencyEnabled)
- [`isScreenReaderEnabled`](../accessibilityinfo/#isScreenReaderEnabled)
- [`addEventListener`](../accessibilityinfo/#addeventlistener)
- [`setAccessibilityFocus`](../accessibilityinfo/#setaccessibilityfocus)
- [`announceForAccessibility`](../accessibilityinfo/#announceforaccessibility)
- [`removeEventListener`](../accessibilityinfo/#removeeventlistener)

---

# Reference

## Methods

### `isBoldTextEnabled()`

```javascript

static isBoldTextEnabled()

```

iOS-Only. Query whether a bold text is currently enabled. Returns a promise which resolves to a boolean. The result is `true` when bold text is enabled and `false` otherwise.

### `isGrayscaleEnabled()`

```javascript

static isGrayscaleEnabled()

```

Query whether grayscale is currently enabled. Returns a promise which resolves to a boolean. The result is `true` when grayscale is enabled and `false` otherwise.

### `isInvertColorsEnabled()`

```javascript

static isInvertColorsEnabled()

```

Query whether invert colors is currently enabled. Returns a promise which resolves to a boolean. The result is `true` when invert colors is enabled and `false` otherwise.

### `isReduceMotionEnabled()`

```javascript

static isReduceMotionEnabled()

```

Query whether reduce motion is currently enabled. Returns a promise which resolves to a boolean. The result is `true` when reduce motion is enabled and `false` otherwise.

### `isReduceTransparencyEnabled()`

```javascript

static isReduceTransparencyEnabled()

```

Query whether reduce transparency is currently enabled. Returns a promise which resolves to a boolean. The result is `true` when a reduce transparency is enabled and `false` otherwise.

### `isScreenReaderEnabled()`

```javascript

static isScreenReaderEnabled()

```

Query whether a screen reader is currently enabled. Returns a promise which resolves to a boolean. The result is `true` when a screen reader is enabled and `false` otherwise.

---

### `addEventListener()`

```javascript

static addEventListener(eventName, handler)

```

Add an event handler. Supported events:

- `boldTextChanged`: iOS-only event. Fires when the state of the bold text toggle changes. The argument to the event handler is a boolean. The boolean is `true` when bold text is enabled and `false` otherwise.
- `grayscaleChanged`: iOS-only event. Fires when the state of the gray scale toggle changes. The argument to the event handler is a boolean. The boolean is `true` when a gray scale is enabled and `false` otherwise.
- `invertColorsChanged`: iOS-only event. Fires when the state of the invert colors toggle changes. The argument to the event handler is a boolean. The boolean is `true` when invert colors is enabled and `false` otherwise.
- `reduceMotionChanged`: Fires when the state of the reduce motion toggle changes. The argument to the event handler is a boolean. The boolean is `true` when a reduce motion is enabled (or when "Transition Animation Scale" in "Developer options" is "Animation off") and `false` otherwise.
- `screenReaderChanged`: Fires when the state of the screen reader changes. The argument to the event handler is a boolean. The boolean is `true` when a screen reader is enabled and `false` otherwise.
- `reduceTransparencyChanged`: iOS-only event. Fires when the state of the reduce transparency toggle changes. The argument to the event handler is a boolean. The boolean is `true` when reduce transparency is enabled and `false` otherwise.
- `announcementFinished`: iOS-only event. Fires when the screen reader has finished making an announcement. The argument to the event handler is a dictionary with these keys:
  - `announcement`: The string announced by the screen reader.
  - `success`: A boolean indicating whether the announcement was successfully made.

---

### `setAccessibilityFocus()`

```javascript

static setAccessibilityFocus(reactTag)

```

Set accessibility focus to a React component. On Android, this is equivalent to `UIManager.sendAccessibilityEvent(reactTag, UIManager.AccessibilityEventTypes.typeViewFocused);`.

---

### `announceForAccessibility()`

```javascript

static announceForAccessibility(announcement)

```

Post a string to be announced by the screen reader.

---

### `removeEventListener()`

```javascript

static removeEventListener(eventName, handler)

```

Remove an event handler.
