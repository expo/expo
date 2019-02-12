---
title: Font
---

Allows loading fonts from the web and using them in React Native components. See more detailed usage information in the [Using Custom Fonts](../../guides/using-custom-fonts/#using-custom-fonts) guide.

## Usage

### `Font.loadAsync(object)`

Convenience form of [`Font.loadAsync()`](#expofontloadasync "Font.loadAsync") that loads multiple fonts at once.

#### Arguments

-   **map : `object`** -- A map of names to `require` statements as in [`Font.loadAsync()`](#fontloadasync).

#### Example

```javascript
Font.loadAsync({
  Montserrat: require('./assets/fonts/Montserrat.ttf'),
  'Montserrat-SemiBold': require('./assets/fonts/Montserrat-SemiBold.ttf'),
});
```

#### Returns

Returns a promise. The promise will be resolved when the fonts have finished loading.
