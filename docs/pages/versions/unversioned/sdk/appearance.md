---
title: Appearance
---

Detect preferred color scheme (`light`, `dark` or `no-preference`) on iOS 13+ and Android 10+.

## Installation

To install this API in a [managed](../../introduction/managed-vs-bare/#managed-workflow) or [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, run `expo install react-native-appearance`. In bare apps, make sure you also follow the [react-native-appearance linking and configuration instructions](https://github.com/expo/react-native-appearance#linking).

## Configuration

You can configure supported appearance styles in managed apps inside `app.json` with the `userInterfaceStyle` key. You can also configure specific platform to support different appearance styles by setting either `android.userInterfaceStyle` or `ios.userInterfaceStyle` to preferred value.
Available options are `automatic` (follow system appearance settings and notify about any change user makes), `light` (restrict app to support light theme only) or `dark` (restrict app to support dark theme only).
If this key is absent, the `light` style will be forced.

Example `app.json` configuration:
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
- **iOS**: you can configure supported styles with the [UIUserInterfaceStyle](https://developer.apple.com/documentation/bundleresources/information_property_list/uiuserinterfacestyle) key in your app `Info.plist`.
- **Android**: please follow steps from [`react-native-appearance` repo](https://github.com/expo/react-native-appearance#configuration).

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
