---
title: Font
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-42/packages/expo-font'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

**`expo-font`** allows loading fonts from the web and using them in React Native components. See more detailed usage information in the [Fonts](../../../guides/using-custom-fonts.md) guide.

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="expo-font" />

# API

```js
import * as Font from 'expo-font';
```

## Hooks

### `useFonts`

```ts
import { useFonts } from 'expo-font';

const [loaded, error] = useFonts({ ... });
```

Load a map of fonts with [`loadAsync`](#loadasyncobject). This returns a boolean if the fonts are loaded and ready to use. It also returns an error if something went wrong, to use in development.

#### Arguments

- **fonts (_{ [fontFamily: string]: FontSource }_)** -- A map of `fontFamily`s to [`FontSource`](#fontsource)s. After loading the font you can use the **key** in the `fontFamily` style prop of a `Text` element.

#### Returns

- **loaded (_boolean_)** -- A boolean to detect if the font for `fontFamily` has finished loading.
- **error (_Error | null_)** -- An error encountered when loading the fonts.

#### Example: hook

<SnackInline
label='useFonts'
dependencies={['expo-font']}
files={{
    'assets/fonts/Montserrat.ttf': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/ee6539921d713482b8ccd4d0d23961bb'
  }}>

```tsx
import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';

export default function App() {
  /* @info */ const [loaded] = useFonts({
    Montserrat: require('./assets/fonts/Montserrat.ttf'),
  });
  /* @end */

  if (!loaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={{ fontFamily: 'Montserrat', fontSize: 30 }}>Montserrat</Text>
    </View>
  );
}

/* @hide const styles = StyleSheet.create({ ... }); */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
/* @end */
```

</SnackInline>

## Methods

### `Font.loadAsync(object)`

Highly efficient method for loading fonts from static or remote resources which can then be used with the platform's native text elements. In the browser this generates a `@font-face` block in a shared style sheet for fonts. No CSS is needed to use this method.

#### Arguments

- **{ [fontFamily: string]: FontSource }** -- A map of `fontFamily`s to [`FontSource`](#fontsource)s. After loading the font you can use the **key** in the `fontFamily` style prop of a `Text` element.

#### Example: functions

<SnackInline
label='Font.loadAsync'
dependencies={['expo-font']}
files={{
    'assets/fonts/Montserrat.ttf': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/ee6539921d713482b8ccd4d0d23961bb',
    'assets/fonts/Montserrat-SemiBold.ttf': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/c641dbee1d75892e4d88bdc31560c91b'
  }}>

```tsx
import * as React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import * as Font from 'expo-font';

export default class App extends React.Component {
  state = {
    fontsLoaded: false,
  };

  async loadFonts() {
    /* @info */ await Font.loadAsync({
      // Load a font `Montserrat` from a static resource
      Montserrat: require('./assets/fonts/Montserrat.ttf'),

      // Any string can be used as the fontFamily name. Here we use an object to provide more control
      'Montserrat-SemiBold': {
        uri: require('./assets/fonts/Montserrat-SemiBold.ttf'),
        display: Font.FontDisplay.FALLBACK,
      },
    });
    /* @end */
    this.setState({ fontsLoaded: true });
  }

  componentDidMount() {
    this.loadFonts();
  }

  render() {
    // Use the font with the fontFamily property after loading
    if (this.state.fontsLoaded) {
      return (
        <View style={styles.container}>
          <Text style={{ fontSize: 20 }}>Default Font</Text>
          <Text style={{ fontFamily: 'Montserrat', fontSize: 20 }}>Montserrat</Text>
          <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 20 }}>
            Montserrat-SemiBold
          </Text>
        </View>
      );
    } else {
      return null;
    }
  }
}

/* @hide const styles = StyleSheet.create({ ... }); */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
/* @end */
```

</SnackInline>

#### Returns

Returns a promise that resolves when the font has loaded. Often you may want to wrap the method in a `try/catch/finally` to ensure the app continues if the font fails to load.

### `Font.isLoaded(fontFamily)`

Synchronously detect if the font for `fontFamily` has finished loading.

#### Arguments

- **fontFamily: _string_** -- name used to load the [FontResource](#fontresource)

#### Returns

`true` if the the font has fully loaded.

### `Font.isLoading(fontFamily)`

Synchronously detect if the font for `fontFamily` is still being loaded

#### Arguments

- **fontFamily: _string_** -- name used to load the [FontResource](#fontresource)

#### Returns

`true` if the the font is still loading.

## Types

### `FontDisplay`

Sets the [font-display][font-display] for a given typeface. This currently **only works on web** (support is limited so remember to [check the coverage](https://caniuse.com/#search=font-display)). The default font value on web is `FontDisplay.AUTO`. Even though setting the `fontDisplay` does nothing on native platforms, the default behavior emulates `FontDisplay.SWAP` on flagship devices like iOS, Samsung, Pixel, etc. Default functionality varies on One Plus devices. In the browser this value is set in the generated `@font-face` CSS block and not as a style property meaning you cannot dynamically change this value based on the element it's used in.

- `AUTO`: (Default on web) The font display strategy is defined by the user agent or platform. This generally defaults to the text being invisible until the font is loaded. Good for buttons or banners that require a specific treatment.
- `SWAP`: Fallback text is rendered immediately with a default font while the desired font is loaded. This is good for making the content appear to load instantly and is usually preferred.
- `BLOCK`: The text will be invisible until the font has loaded. If the font fails to load then nothing will appear - it's best to turn this off when debugging missing text.
- `FALLBACK`: Splits the behavior between `SWAP` and `BLOCK`. There will be a [100ms timeout][fallback-loading] where the text with a custom font is invisible, after that the text will either swap to the styled text or it'll show the unstyled text and continue to load the custom font. This is good for buttons that need a custom font but should also be quickly available to screen-readers.
- `OPTIONAL`: This works almost identically to `FALLBACK`, the only difference is that the browser will decide to load the font based on slow connection speed or critical resource demand.

[font-display]: https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display
[fallback-loading]: https://developers.google.com/web/updates/2016/02/font-display?hl=en

```ts
enum FontDisplay {
  AUTO = 'auto',
  BLOCK = 'block',
  SWAP = 'swap',
  FALLBACK = 'fallback',
  OPTIONAL = 'optional',
}

await Font.loadAsync({
  roboto: {
    uri: require('./roboto.ttf'),
    // Only effects web
    display: FontDisplay.SWAP,
  },
});
```

### `FontResource`

Used to dictate the resource that is loaded into the provided font namespace when used with [`loadAsync`](#fontloadasyncobject). Optionally on web you can define a `display` value which sets the [`font-display`](#fontdisplay) property for a given typeface in the browser.

```ts
type FontResource = {
  uri: string | number;
  display?: FontDisplay;
};
```

### `FontSource`

The different types of assets you can provide to the [`loadAsync()`](#fontloadasyncobject) function. A font source can be a URI, a module ID, or an Expo Asset.

```ts
type FontSource = string | number | Asset | FontResource;
```

## Error Codes

| Code                | Description                                                       |
| ------------------- | ----------------------------------------------------------------- |
| ERR_FONT_API        | If the arguments passed to `loadAsync` are invalid.               |
| ERR_FONT_SOURCE     | The provided resource was of an incorrect type.                   |
| ERR_WEB_ENVIRONMENT | The browser's `document` element doesn't support injecting fonts. |
| ERR_DOWNLOAD        | Failed to download the provided resource.                         |
| ERR_FONT_FAMILY     | Invalid font family name was provided.                            |
| ERR_UNLOAD          | Attempting to unload fonts that haven't finished loading yet.     |
