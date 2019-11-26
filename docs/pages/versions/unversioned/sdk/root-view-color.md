---
title: RootViewColor
---

Configure the background color of your app's root view. This view is visible when reorienting a device, or when using modals such as `pageSheet` and `formSheet` on iOS.

## Installation

To install this API in a [managed](../../introduction/managed-vs-bare/#managed-workflow) or [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, run `expo install expo-root-view-color`. In bare apps, make sure you also follow the [expo-root-view linking and configuration instructions](FIX THIS DEAD LINK).

## Configuration

You can configure the root view's background color in managed apps inside your `app.json` file, with the `rootViewColor` key. You can set this key to any hex-color string.

Example `app.json` configuration:

```json
{
  "expo": {
    "rootViewColor": "#FFFFFF"
  }
}
```

In bare apps:

- **iOS**: Open your project's `AppDelegate.m`, and after `rootView` is instantiated, set

```
rootView.backgroundColor = [[UIColor alloc] initWithRed:0.XX green:0.XX blue:0.XX alpha:X];
```

using your desired RGBA values.

- **Android**: Open your project's `android/app/src/main/res/values/colors.xml`, and set

```xml
<color name="background">#HEX_VALUE</color>
```

## API

To import this library, use:

```js
import { setRootViewColor } from 'expo-root-view-color';
```

One way to use this library is in conjunction with the [Appearance](../appearance) module. Get the current color scheme, and set the root view color, accordingly:

```js
function MyComponent() {
  let colorScheme = useColorScheme();

  if (colorScheme === 'dark') {
    // use a dark background with a dark theme
    setRootViewColor('#000000');
  } else {
    setRootViewColor('#ffffff');
  }
}
```
