---
title: Appearance
---

Detect preferred color scheme (light, dark, or no preference) on iOS 13+.

## Installation

To install this API in a [managed](../../introduction/managed-vs-bare/#managed-workflow) or [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, run `expo install react-native-appearance`. In bare apps, make sure you also follow the [react-native-appearance linking and configuration instructions](https://github.com/expo/react-native-appearance#linking).

## Configuration

You can configure supported appearance styles in managed apps inside `app.json` with the `ios.userInterfaceStyle` key. If this key is absent, the `light` style will be forced. If you'd like to allow the user to switch their preferred style in operating system preferences and detect that with the `Appearance` API, you should set `userInterfaceStyle` to `"automatic"`:

```json
{
  "expo": {
    "ios": {
      "userInterfaceStyle": "automatic"
    }
  }
}
```

In bare apps, you can configure supported styles with the [UIUserInterfaceStyle](https://developer.apple.com/documentation/bundleresources/information_property_list/uiuserinterfacestyle) key in your app `Info.plist`.

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