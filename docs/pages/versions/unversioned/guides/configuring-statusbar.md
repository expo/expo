---
title: Configuring StatusBar
---

Expo and React Native provide APIs and configuration options for Android to configure the status bar for your app. These can be used to control the appearance of the status bar in your app.

## Configuration (Android)

The configuration for Android status bar lives under the `androidStatusBar` key in `app.json`. It exposes the following options:

### `barStyle`

This option can be used to specify whether the status bar content (icons and text in the status bar) is light, or dark. Usually a status bar with a light background has dark content, and a status bar with a dark background has light content.

The valid values are:

- `light-content` - The status bar content is light colored (usually white). This is the default value.
- `dark-content` - The status bar content is dark colored (usually dark grey). This is only available on Android 6.0 onwards. It will fallback to `light-content` in older versions.

### `backgroundColor`

This option can be used to set a background color for the status bar.

Keep in mind that the Android status bar is translucent by default in Expo apps. But, when you specify an opaque background color for the status bar, it'll lose it's translucency.

The valid value is a hexadecimal color string. e.g. - #C2185B

## Working with 3rd-party Libraries

Expo makes the status bar translucent by default on Android which is consistent with iOS, and more in line with material design. Unfortunately some libraries don't support translucent status bar, e.g. - navigation libraries, libraries which provide a header bar etc.

If you need to use such a library, there are a few options:

### Set the `backgroundColor` of the status bar to an opaque color

This will disable the translucency of the status bar. This is a good option if your status bar color never needs to change.

Example:

```json
{
  "expo": {
    "androidStatusBar": {
      "backgroundColor": "#C2185B"
    }
  }
}
```

### Use the [`StatusBar` API from React Native](https://facebook.github.io/react-native/docs/statusbar.html)

The `StatusBar` API allows you to dynamically control the appearance of the status bar. You can use it as component, or as an API. Check the documentation on the React Native website for examples.

## Place an empty `View` on top of your screen

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
