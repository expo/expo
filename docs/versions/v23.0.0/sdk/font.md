---
title: Font
---

Allows loading fonts from the web and using them in React Native components. See more detailed usage information in the [Using Custom Fonts](../../guides/using-custom-fonts/#using-custom-fonts) guide.

## Usage

### `Expo.Font.loadAsync(name, url)`

Load a font from the web and associate it with the given name.

#### Arguments

-   **name (_string_)** -- A name by which to identify this font. You can make up any name you want; this will be the name that you use when setting `fontFamily`. For example, if the name is `'open-sans'` then your `Text` component would look like: `<Text style={{fontFamily: 'open-sans'}}>Hello world</Text>`

- **url (_string_)** -- This can be either a remote URL or a `require` statement for the font file.

Example:

```js
Expo.Font.loadAsync('open-sans', 'http://url/to/open-sans.ttf');
```

#### Returns

Doesn't return anything and simply awaits till the font is available to use.

### `Expo.Font.loadAsync(map)`

Convenience form of [`Expo.Font.loadAsync()`](#expofontloadasync "Expo.Font.loadAsync") that loads multiple fonts at once.

#### Arguments

-   **map (_object_)** -- A map of names to urls/`require` statements as in [`Expo.Font.loadAsync()`](#expofontloadasync "Expo.Font.loadAsync").

#### Example

```javascript
Expo.Font.loadAsync({
  Montserrat: require('./assets/fonts/Montserrat.ttf'),
  'Montserrat-SemiBold': require('./assets/fontsMontserrat-SemiBold.ttf'),
});
```

This is equivalent to calling [`Expo.Font.loadAsync()`](#expofontloadasync "Expo.Font.loadAsync") once per name and URL pair.

#### Returns

Doesn't return anything and simply awaits till all fonts are available to use.

