---
title: Appearance
---

Detect preferred color scheme (light, dark, or no preference) on iOS 13+.

## Installation

To install this API in a [managed](../../introduction/managed-vs-bare/#managed-workflow) or [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, run `expo install react-native-appearance`. In bare apps, make sure you also follow the [react-native-appearance linking and configuration instructions](https://github.com/expo/react-native-appearance#linking).

> **Note:** In managed apps you will need to also configure `userInterfaceStyle` property in the [`ios` object in `app.json`](../../workflow/configuration/#ios) and set it to `"automatic"`.

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

  const themeStatusBarStyle =
    colorScheme === 'light' ? 'dark-content' : 'light-content';
  const themeTextStyle =
    colorScheme === 'light' ? styles.lightThemeText : styles.darkThemeText;
  const themeContainerStyle =
    colorScheme === 'light' ? styles.lightContainer : styles.darkContainer;

  return (
    <SafeAreaView style={[styles.container, themeContainerStyle]}>
      <StatusBar barStyle={themeStatusBarStyle} />
      <Text style={[styles.text, themeTextStyle]}>
        Color scheme: {colorScheme}
      </Text>
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
