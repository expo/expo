---
title: Appearance
sourceCodeUrl: 'https://github.com/expo/react-native-appearance'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

> ⚠️ The **`react-native-appearance`** package has been replaced by [Appearance](../react-native/appearance.md) and [useColorScheme](../react-native/usecolorscheme.md) from `react-native`. The `react-native-appearance` package will be removed from the Expo SDK in SDK 43.

**`react-native-appearance`** allows you to detect the user's preferred color scheme (`light`, `dark` or `no-preference`) on iOS 13+ and Android 10+.

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="react-native-appearance" href="https://github.com/expo/react-native-appearance#linking" />

## Configuration

You can configure supported appearance styles in managed apps inside **app.json** with the `userInterfaceStyle` key. You can also configure specific platform to support different appearance styles by setting either `android.userInterfaceStyle` or `ios.userInterfaceStyle` to preferred value.
The available options are: `automatic` (follow system appearance settings and notify about any change user makes), `light` (restrict app to support light theme only), and `dark` (restrict app to support dark theme only).
If this key is absent, the app will default to the `light` style.

Example **app.json** configuration:

```json
{
  "expo": {
    "userInterfaceStyle": "automatic",
    "ios": {
      "userInterfaceStyle": "light"
    },
    "android": {
      "userInterfaceStyle": "dark"
    }
  }
}
```

In bare apps:

- **iOS**: you can configure supported styles with the [UIUserInterfaceStyle](https://developer.apple.com/documentation/bundleresources/information_property_list/uiuserinterfacestyle) key in your app **Info.plist**.
- **Android**: please follow steps from the [`react-native-appearance` repo](https://github.com/expo/react-native-appearance#configuration).

## API

To import this library, use:

```js
import { Appearance, AppearanceProvider, useColorScheme } from 'react-native-appearance';
```

Next you need to wrap your app root component with an `AppearanceProvider`.

```js
import { AppearanceProvider } from 'react-native-appearance';

export default () => (
  <AppearanceProvider>
    <App />
  </AppearanceProvider>
);
```

Get the current color scheme imperatively with `Appearance.getColorScheme()` and listen to changes with `Appearance.addChangeListener`

```js
let colorScheme = Appearance.getColorScheme();

let subscription = Appearance.addChangeListener(({ colorScheme }) => {
  // do something with color scheme
});

// when you're done
subscription.remove();
```

If you're using hooks, this is made even easier with the `useColorScheme()` hook:

```js
function MyComponent() {
  let colorScheme = useColorScheme();

  if (colorScheme === 'dark') {
    // render some dark thing
  } else {
    // render some light thing
  }
}
```

Below you can find an example of a simple application utilizing color scheme of the system:

```js
import React from 'react';
import { Text, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { AppearanceProvider, useColorScheme } from 'react-native-appearance';

export default function AppContainer() {
  return (
    <AppearanceProvider>
      <App />
    </AppearanceProvider>
  );
}

function App() {
  const colorScheme = useColorScheme();

  const themeStatusBarStyle = colorScheme === 'light' ? 'dark-content' : 'light-content';
  const themeTextStyle = colorScheme === 'light' ? styles.lightThemeText : styles.darkThemeText;
  const themeContainerStyle =
    colorScheme === 'light' ? styles.lightContainer : styles.darkContainer;

  return (
    <SafeAreaView style={[styles.container, themeContainerStyle]}>
      <StatusBar barStyle={themeStatusBarStyle} />
      <Text style={[styles.text, themeTextStyle]}>Color scheme: {colorScheme}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightContainer: {
    backgroundColor: '#D0D0C0',
  },
  darkContainer: {
    backgroundColor: '#242C40',
  },
  lightThemeText: {
    color: '#242C40',
  },
  darkThemeText: {
    color: '#D0D0C0',
  },
});
```

## Tips

While you're developing, you may want to change your simulator's or device's appearance.

- If working with an iOS emulator locally, you can use the `command` + `shift` + `a` shortcut to toggle between light and dark mode.
- If using an Android emulator, you can run `adb shell "cmd uimode night yes"` to enable dark mode, and `adb shell "cmd uimode night no"` to disable dark mode.
- If using a real device or an Android emulator, you can toggle the system dark mode setting in the device's settings.
