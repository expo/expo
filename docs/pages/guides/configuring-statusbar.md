---
title: Configuring the Status Bar
---

The status bar configuration often feels like a small detail to a developer, but it can make a big difference on the overall feel and perceived level of polish of your app by users. When you have a white status bar on a white background, you just know something isn't going quite right.

This guide is intended to help you know what tools are at your disposal to configure the status bar for your iOS and Android apps.

<div style={{backgroundColor: '#fafafa', flex: 1, textAlign: 'center'}}>
  <img src="/static/images/status-bar-style-comparison.png" alt="A comparison of good and bad status bar styling" />
</div>

<br />

> 👀 Notice how bad the contrast is between the status bar text and the background in the second image. This is what we want to try to avoid.

## Configuring the status bar while your app is loading (Android only)

> This type of configuration is currently only available on Android. On iOS, it is not possible in the Expo managed workflow to customize the status bar before the app has loaded, while the splash screen is presented.

The configuration for configuring the status bar while the splash screen is visible on Android is available through the `androidStatusBar` object in `app.json`. The options available are similar to those provided by [expo-status-bar](../../sdk/status-bar).

<div style={{marginTop: -10}} />

<details><summary><h4>See the full list of options available to configure the status bar statically on Android.</h4></summary>
<p>

### `androidStatusBar.barStyle`

This option can be used to specify whether the status bar content (icons and text in the status bar) is light, or dark. Usually a status bar with a light background has dark content, and a status bar with a dark background has light content.

The valid values are:

- `light-content` - The status bar content is light colored (usually white).
- `dark-content` - The status bar content is dark colored (usually dark grey). This is only available on Android 6.0 onwards. It will fallback to `light-content` in older versions. This is the default value.

> Note: If you choose `light-content` and have either a very light image set as the `SplashScreen` or `backgroundColor` set to a light color, the status bar icons may blend in and not be visible.
> Same goes for `dark-content` when you have a very dark image set as the `SplashScreen` or `backgroundColor` set to a dark color.

### `androidStatusBar.backgroundColor`

This option can be used to set a background color for the status bar.
The valid value is a 6-character long hexadecimal solid color string with the format `#RRGGBB` (e.g. `#C2185B`) or 8-character long hexadecimal color string with transparency with the format `#RRGGBBAA` (e.g. `#23C1B255`).
Defaults to `#00000000` (fully transparent color) for `dark-content` bar style and `#00000088` (semi-transparent black) for `light-content` bar style.

### `androidStatusBar.translucent`

Value type - `boolean`.
Specifies whether the status bar should be translucent.
When this is set to `true`, the status bar is visible on the screen, but it takes no space and your application can draw beneath it (similar to a `View` element with styles `{ position: "absolute", top: 0 }` that is rendered above the app content at the top of the screen).
When this is set to `false`, the status bar behaves as a block element and limits space available on your device's screen.
Defaults to `true`.

> Note: A translucent status bar makes sense when the `backgroundColor` is using a transparent color (`#RRGGBBAA`).
> When you use a translucent status bar and a solid `backgroundColor` (`#RRGGBB`) then the upper part of your app will be partially covered by the non-transparent status bar and thus some of your app's content might not be visible to the user.

### `androidStatusBar.hidden`

Value type - `boolean`.
Tells the system whether the status bar should be visible or not.
When the status bar is not visible it can be presented via the `swipe down` gesture.
When set to `true`, the status bar will not respect `backgroundColor` or `barStyle` settings.
Defaults to `false`.

</p>
</details>

## Updating the status bar while your app is running

The `StatusBar` component provided by [expo-status-bar](../../sdk/status-bar/) allows you to control the appearance of the status bar while your app is running. [expo-status-bar](../../sdk/status-bar/) also provides imperative methods such as `setBarStyle(barStyle)` to control the style through function calls rather than the `StatusBar` component, if you find that to be helpful for your use case.

To fix the contrast issue from the screenshot at the top of this guide, we could use the following code:

```js
import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function Playlists() {
  return (
    <View>
      {/* other code here to show the screen */}

      {/* use light text instead of dark text in the status bar to provide more contrast with a dark background */}
      <StatusBar barStyle="light-content" />
    </View>
  );
}
```

<details><summary><h4>How is expo-status-bar different from the StatusBar component included in React Native?</h4></summary>
<p>

`expo-status-bar` builds on top of the `StatusBar` component that React Native provides in order to give you better defaults when you're building an app with Expo tools. For example, the `translucent` property of `expo-status-bar` defaults to `true` or, if you have changed that property in `androidStatusBar`, it will use that value instead. The default in React Native for `translucent` is always `false`, which can be confusing when in projects created using Expo tools, because the default is `true` for consistency with iOS.

</p>
</details>

## Factoring the status bar in with your layout

When you have a translucent status bar, it's important to remember that content can be rendered underneath it (if it couldn't, what would be the point of it being translucent? there would be nothing for you to see through it!).

Libraries like [React Navigation](../../guides/routing-and-navigation/) will handle this for you when the UI that they provide overlap with the status bar. You are likely to encounter cases where you will need to manually adjust your layout to prevent some content (such as text) from being rendered underneath it. To do this, we recommend using [react-native-safe-area-context](../../sdk/safe-area-context/) to find the safe area insets and add padding or margins to your layout accordingly.

## Working with misbehaving 3rd-party Libraries

Projects initialized with Expo tools make the status bar `translucent` by default on Android. This is consistent with iOS and more in line with material design. Unfortunately, some libraries don't support `translucent` status bars. This is generally bad practice and those libraries should be fixed, but if you must use one of them, there are some options available for you to accommodate their limitations:

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

### Place an empty `View` on top of your screen

You can place an empty `View` on top of your screen with a background color to act as a status bar, or set a top padding. You can get the height of the status bar (and notch, if there is one) by using the top inset value provided by [react-native-safe-area-context](../../sdk/safe-area-context/).
