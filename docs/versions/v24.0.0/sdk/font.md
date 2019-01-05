---
title: Font
---

Allows loading fonts from the web and using them in React Native components. See more detailed usage information in the [Using Custom Fonts](../../guides/using-custom-fonts/#using-custom-fonts) guide.

## Usage

### `Expo.Font.loadAsync(object)`

Convenience form of [`Expo.Font.loadAsync()`](#expofontloadasync "Expo.Font.loadAsync") that loads multiple fonts at once.

#### Arguments

-   **map (_object_)** -- A map of names to `require` statements as in [`Expo.Font.loadAsync()`](#expofontloadasync "Expo.Font.loadAsync").

#### Example

```javascript
Expo.Font.loadAsync({
  Montserrat: require('./assets/fonts/Montserrat.ttf'),
  'Montserrat-SemiBold': require('./assets/fontsMontserrat-SemiBold.ttf'),
});
```

#### Returns

Doesn't return anything and simply awaits till all fonts are available to use.

