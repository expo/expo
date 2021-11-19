---
id: statusbar
title: StatusBar
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-43/packages/expo-status-bar'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

**`expo-status-bar`** gives you a component and imperative interface to control the app status bar to change its text color, background color, hide it, make it translucent or opaque, and apply animations to any of these changes. Exactly what you are able to do with the `StatusBar` component depends on the platform you're using.

<PlatformsSection android emulator ios simulator web />

> **Web browser support**: there is no API available on the web for controlling the operating system status bar, so `expo-status-bar` will noop (it will do nothing, it will also not error).

## Installation

<InstallSection packageName="expo-status-bar" />

## Usage

<SnackInline dependencies={["expo-status-bar"]}>

```js
import React from 'react';
import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default class App extends React.Component {
  render() {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#000',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{ color: '#fff' }}>Notice that the status bar has light text!</Text>
        <StatusBar style="light" />
      </View>
    );
  }
}
```

</SnackInline>

## API

```js
import { StatusBar } from 'expo-status-bar';
```

## Components

### `StatusBar`

A component that allows you to configure your status bar without directly calling imperative methods like `setBarStyle`.

You will likely have multiple `StatusBar` components mounted in the same app at the same time. For example, if you have multiple screens in your app, you may end up using one per screen. The props of each `StatusBar` component will be merged in the order that they were mounted. This component is built on top of the [StatusBar](https://reactnative.dev/docs/statusbar) component exported from React Native, and it provides defaults that work better for Expo users.

#### Props

- **style (_[StatusBarStyle](#statusbarstyle)_)** - The color of the status bar text.
- **animated (_boolean_)** - If the transition between status bar property changes, such as `style`, should be animated.
- **hidden (_boolean_)** - If the status bar should be hidden.
- **networkActivityIndicatorVisible (_boolean_)** - If the network activity indicator should be visible. _[iOS only]_
- **hideTransitionAnimation (_[StatusBarAnimation](#statusbaranimation)_)** - The transition effect when showing and hiding the status bar. Defaults to `'fade'`. _[iOS only]_
- **backgroundColor (_string_)** - The background color of the status bar. _[Android only]_
- **translucent (_boolean_)** - Whether the app can draw under the status bar. When `true`, content will be rendered under the status bar. This is always `true` on iOS and cannot be changed. On Android, the default is also `true` unless you have explicitly configured the `androidStatusBar.translucent` key in **app.json** to `false`. _[Android only]_

## Methods

### `setStatusBarBackgroundColor(backgroundColor, animated)`

Set the background color of the status bar. _[Android only]_

#### Arguments

- **backgroundColor (_string_)** - The background color of the status bar.
- **animated (_boolean_)** - `true` to animate the background color change, `false` to change immediately.

### `setStatusBarHidden(hidden, animation)`

Toggle visibility of the status bar.

#### Arguments

- **hidden (_boolean_)** - If the status bar should be hidden.
- **animation (_[StatusBarAnimation](#statusbaranimation)_)** - Animation to use when toggling hidden, defaults to `'none'`.

### `setStatusBarNetworkActivityIndicatorVisible(visible)`

Toggle visibility of the network activity indicator. _[iOS only]_

#### Arguments

- **visible (_boolean_)** - If the network activity indicator should be visible.

### `setStatusBarStyle(style)`

Set the bar style of the status bar.

#### Arguments

- **style (_[StatusBarStyle](#statusbarstyle)_)** - The color of the status bar text.

### `setStatusBarTranslucent(translucent)`

Set the translucency of the status bar. _[Android only]_

#### Arguments

- **translucent (_boolean_)** - Whether the app can draw under the status bar. When `true`, content will be rendered under the status bar. This is always `true` on iOS and cannot be changed.

## Types

### `StatusBarAnimation`

A string, either: `'none'`, `'fade'`, or `'slide'`.

### `StatusBarProps`

See the props of the [StatusBar](#statusbar) component.

### `StatusBarStyle`

A string, either: `'auto'`, `'inverted'`, `'light'`, or `'dark'`.
