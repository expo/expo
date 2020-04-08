---
title: Configuring StatusBar
---

Expo and React Native provide APIs and configuration options for Android to configure the status bar for your app. These can be used to control the appearance of the status bar in your app.

## Configuration (Android)

The configuration for Android status bar lives under the `androidStatusBar` key in `app.json`. It exposes the following options:

### `barStyle`

This option can be used to specify whether the status bar content (icons and text in the status bar) is light, or dark. Usually a status bar with a light background has dark content, and a status bar with a dark background has light content.

The valid values are:
- `light-content` - The status bar content is light colored (usually white).
- `dark-content` - The status bar content is dark colored (usually dark grey). This is only available on Android 6.0 onwards. It will fallback to `light-content` in older versions. This is the default value.

> Note: If you choose `light-content` and have either a very light image set as the `SplashScreen` or `backgroundColor` set to a light color, the status bar icons may blend in and not be visible.
> Same goes for `dark-content` when you have a very dark image set as the `SplashScreen` or `backgroundColor` set to a dark color.

### `backgroundColor`

This option can be used to set a background color for the status bar.
The valid value is a 6-character long hexadecimal solid color string with the format `#RRGGBB` (e.g. `#C2185B`) or 8-character long hexadecimal color string with transparency with the format `#RRGGBBAA` (e.g. `#23C1B255`).
Defaults to `#00000000` (fully transparent color) for `dark-content` bar style and `#00000088` (semi-transparent black) for `light-content` bar style.

### `translucent`

Value type - `boolean`.
Specifies whether the status bar should be translucent.
When this is set to `true`, the status bar is visible on the screen, but it takes no space and your application can draw beneath it (similar to a `View` element with styles `{ position: "absolute", top: 0 }` that is rendered above the app content at the top of the screen).
When this is set to `false`, the status bar behaves as a block element and limits space available on your device's screen.
Defaults to `true`.

> Note: A translucent status bar makes sense when the `backgroundColor` is using a transparent color (`#RRGGBBAA`).
> When you use a translucent status bar and a solid `backgroundColor` (`#RRGGBB`) then the upper part of your app will be partially covered by the non-transparent status bar and thus some of your app's content might not be visible to the user.

### `hidden`

Value type - `boolean`.
Tells the system whether the status bar should be visible or not.
When the status bar is not visible it can be presented via the `swipe down` gesture.
When set to `true`, the status bar will not respect `backgroundColor` or `barStyle` settings.
Defaults to `false`.

## Working with 3rd-party Libraries

Expo makes the status bar `translucent` by default on Android which is consistent with iOS, and more in line with material design. Unfortunately some libraries don't support `translucent` status bars, e.g. - navigation libraries, libraries which provide a header bar etc.

If you need to use such a library, there are a few options:

### Set the `backgroundColor` of the status bar to an opaque color and disable `translucent` option

Setting solely `backgroundColor` to an opaque color will disable the `transparency` of the status bar, but preserve `translucency`.
You need to explicitly set `translucent` to `false` if you want your app's status bar to take up space on the device's screen.
This is a good option if your status bar color never needs to change.

Example:
```json
{
  "expo": {
    "androidStatusBar": {
      "backgroundColor": "#C2185B",
      "translucent": false
    }
  }
}
```

### Use the [`StatusBar` API from React Native](https://facebook.github.io/react-native/docs/statusbar.html)

The `StatusBar` API allows you to dynamically control the appearance of the status bar. You can use it as component, or as an API. Check the documentation on the React Native website for examples.

### Place an empty `View` on top of your screen

You can place an empty `View` on top of your screen with a background color to act as a status bar, or set a top padding. You can get the height of the status bar with `Constants.statusBarHeight`. Though this should be your last resort since this doesn't work very well when status bar's height changes.

Example:
```js
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';

const styles = StyleSheet.create({
  statusBar: {
    backgroundColor: "#C2185B",
    height: Constants.statusBarHeight,
  },

  // rest of the styles
});

const MyComponent = () => {
  <View>
    <View style={styles.statusBar} />
    {/* rest of the content */}
  </View>
}
```

If you don't need to set the background color, you can just set a top padding on the wrapping `View` instead.

## Recommended configuration

It is recommended to use the configuration in `app.json` to obtain the appearance you want to have during the `SplashScreen` phase, and later on use the [`StatusBar` API from React Native](https://facebook.github.io/react-native/docs/statusbar.html) to dynamically adjust status bar appearance.

Example:
```ts
// App.json

{
  ...
  "androidStatusBar": {
    "hidden": false, // default value
    "translucent": true, // default value to align with default iOS behavior
    "barStyle": "dark-content", // default value
    "backgroundColor": "#00000000" // default value depends on "barStyle" value - fully-transparent when it is `dark-content` and semi-transparent black for `light-content` 
  },
  ...
}
```
```tsx
// Root Component

import { StatusBar } from 'react-native';

...

StatusBar.setStyle('dark-content');
StatusBar.setBackgroundColor('#123456');
```
