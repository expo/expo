---
title: Font
old_permalink: /versions/v9.0.0/sdk/font.html
previous___FILE: ./facebook.md
next___FILE: ./imagepicker.md
---

Allows loading fonts from the web and using them in React Native components.

### `Exponent.Font.loadAsync(name, url)`

Load a font from the web and associate it with the given name.

#### Arguments

-   **name (_string_)** -- A name by which to identify this font. You can make up any name you want; you just have to specify the same name in [`Exponent.Font.style()`](#Exponent.Font.style "Exponent.Font.style") to use this font.

#### Returns

Doesn't return anything and simply awaits till the font is available to use.

### `Exponent.Font.loadAsync(map)`

Convenience form of [`Exponent.Font.loadAsync()`](#Exponent.Font.loadAsync "Exponent.Font.loadAsync") that loads multiple fonts at once.

#### Arguments

-   **map (_object_)** -- A map of names to urls as in [`Exponent.Font.loadAsync()`](#Exponent.Font.loadAsync "Exponent.Font.loadAsync").

#### Returns

Doesn't return anything and simply awaits till all fonts are available to use.

#### Example

    Exponent.Font.loadAsync({
      title: '[http://url/to/font1.ttf'](http://url/to/font1.ttf%27),
      cursive: '[http://url/to/font2.ttf'](http://url/to/font2.ttf%27),
    });

This is equivalent to calling [`Exponent.Font.loadAsync()`](#Exponent.Font.loadAsync "Exponent.Font.loadAsync") once per name and URL pair.

### `Exponent.Font.style(name)`

Return style properties to use with a `Text` or other React Native component. It is safe to call this function before calling [`Exponent.Font.loadAsync()`](#Exponent.Font.loadAsync "Exponent.Font.loadAsync"); it will still return the correct style properties. This way you can use this function with `StyleSheet.create()`.

#### Arguments

-   **name (_string_)** -- The name for this font specified in [`Exponent.Font.loadAsync()`](#Exponent.Font.loadAsync "Exponent.Font.loadAsync").

#### Returns

An object with style attributes to use in a `Text` or similar component.

#### Example

    &lt;Text style={{ ...Exponent.Font.style('cursive'), color: 'red' }}>
      Hello world!
    </Text>

Before the component is rendered, the font must be loaded by calling `Exponent.Font.loadAsync('cursive', 'http://url/to/font.ttf')`.
