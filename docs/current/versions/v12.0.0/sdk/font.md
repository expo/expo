---
title: Font
old_permalink: /versions/v12.0.0/sdk/font.html
previous___FILE: ./facebook.md
next___FILE: ./gl-view.md
---

Allows loading fonts from the web and using them in React Native components. See more detailed usage information in the [Using Custom Fonts](/versions/latest/guides/using-custom-fonts#using-custom-fonts) guide.

### `Exponent.Font.loadAsync(name, url)`

Load a font from the web and associate it with the given name.

#### Arguments

-   **name (_string_)** -- A name by which to identify this font. You can make up any name you want; this will be the name that you use when setting `fontFamily`. For example, if the name is `'open-sans'` then your `Text` component would look like: `<Text style={{fontFamily: 'open-sans'}}>Hello world</Text>`

#### Returns

Doesn't return anything and simply awaits till the font is available to use.

### `Exponent.Font.loadAsync(map)`

Convenience form of [`Exponent.Font.loadAsync()`](#Exponent.Font.loadAsync "Exponent.Font.loadAsync") that loads multiple fonts at once.

#### Arguments

-   **map (_object_)** -- A map of names to urls as in [`Exponent.Font.loadAsync()`](#Exponent.Font.loadAsync "Exponent.Font.loadAsync").

#### Returns

Doesn't return anything and simply awaits till all fonts are available to use.

#### Example

```javascript
Exponent.Font.loadAsync({
  title: '[http://url/to/font1.ttf'](http://url/to/font1.ttf%27),
  cursive: '[http://url/to/font2.ttf'](http://url/to/font2.ttf%27),
});
```

This is equivalent to calling [`Exponent.Font.loadAsync()`](#Exponent.Font.loadAsync "Exponent.Font.loadAsync") once per name and URL pair.
