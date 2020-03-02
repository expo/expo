---
title: Using Custom Fonts
---

import SnackEmbed from '~/components/plugins/SnackEmbed';
import SnackInline from '~/components/plugins/SnackInline';

Both iOS and Android and most desktop operating systems come with their own set of platform fonts but if you want to inject some more brand personality into your app, a well picked font can go a long way. And since each
operating system has its own set of platform fonts, if you want to produce an experience that is consistent for all users, you'll want to use your own fonts in your project. This guide will show you how to do that.

## A Minimal but Complete Working Example

<SnackEmbed snackId="@ccheever/custom-font-example" />

> 💡 **This won't preview properly in the web viewer of Snack but works everywhere else.** This is just a bug in Snack that should be fixed soon. This code will work on web in expo-cli apps and on all other platforms in Snack.

If you load this up on a device, you should see something that looks like this:

<img src="/static/images/font-example-custom-font.png" style={{maxWidth: 305}} />

Inter Black is very bold and dark and pretty distinctive so you should be able to tell if you're able to
get the example working right, or if something is wrong. If the platform default font looks a little different
for you, that's fine; the platform default font can vary depending on the operating system and the device manufacturer (on Android).

## Getting a Font

The first thing you'll need is a font file. In this example, we use Inter Black from the free and open source [Inter font family](https://rsms.me/inter/) by Rasmus Anderson.

You'll want either a font in either `.otf` or `.ttf` format. Those are the two formats that work across all Expo platforms (web, iOS, and Android). If you have both an OTF and a TTF file, just use OTF. It's a newer format that is often smaller and sometimes higher quality in some contexts. Either one is fine though.

The convention in Expo apps is to put your fonts in an `./assets/fonts` directory, but you can put them anywhere you like.

In this example (which you can see if you [open the Snack in a dedicated window](https://snack.expo.io/@ccheever/custom-font-example)), we've put our font file, `Inter-Black.otf` in the `./assets/fonts` subdirectory of the project.

## Using the `useFonts` Hook

The example in this guide uses the `useFonts` hook from the [`use-expo`](https://github.com/byCedric/use-expo) hooks library by Cedric van Putten. It is the easiest way to load custom fonts in modern React.

To set it up, first add the library to your project, either by

```shell
yarn add @use-expo/font
```

or

```shell
npm install --save @use-expo/font

```

Once the library is installed, you can import the hook with

```javascript
import { useFonts } from '@use-expo/font';
```

To use any hook in React, you need to use a function component.

The `useFonts` hook returns a single item list containing a value telling you whether the font is loaded or not.

```javascript
[isLoaded] = useFonts({ ... });
```

It takes one argument which is a JS object mapping the names you want to give your fonts to the assets they point to.

The assets can be either assest in your project, specified by `require('./path/to/your_asset')` or they can be URLs to font files on the web, like `'https://example.org/path/to/your_font.ttf'`.

In general, it's best to use assets from your project when possible.

## Using `<AppLoading />`

Since your fonts won't be ready right away, it is generally a good practice to not render anything until the font is ready.

A great way we can do that is to use the [`<AppLoading />`](../sdk/app-loading) component. In its simplest form, you can just render it while you're waiting for your app to load.

Sometimes -- particularly on the web -- people choose to render their content in a platform default font while their custom font is loading. Or, alternatively, to render the rest of their content, that doesn't depend on the custom font while the font is loading.

These approaches are called FOUT and FOIT and you can read a lot more about them on the web.

In general, these strategies are not recommended for Expo apps. If you include your fonts in your project, the
fonts will always be delivered to the user by the time your code is running. The one exception to this is that you may prefer to do this on the web.

# Advanced Topics

## Loading a remote font directly from the web

In general, it's best and safest to load fonts from your local assets. If you submit to app stores, they
will be bundled with the download and available immediately. And you don't have to worry about CORS or other potential issues.

But if you want to do it, it is also possible to load a remote font file directly from the web rather than from your project's assets.

To do this, just replace the `require('./assets/fonts/MyFont.otf')` with the URL of your font.

Here is a minimal, complete example.

<SnackEmbed snackId="@ccheever/remote-font-example" />

> ⚠️ **If loading remote fonts, make sure they are being served from an origin with CORS properly configured** If you don't do this, your remote font might not load properly on the web platform.

## Using `Font.loadAsync` directly

If you don't want to use the `useFonts` hook, you can use `Font.loadAsync` directly.

What is happening under the hood is that your fonts are being loaded using `Font.loadAysnc` from the [`expo-font` library](../sdk/font).

You can use that directly if you prefer, or if you want to have more fine-grained control over when your fonts are loaded before rendering.

<SnackEmbed snackId="@ccheever/font.loadasync-example" />

### Writing your own Hooks

You can use the primitives in the `expo-font` library to write your own hooks if you want. Here is a basic implementation of a hook that works just like the `useFonts` library above.

<SnackInline>

```js
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { AppLoading } from 'expo';
import * as Font from 'expo-font';

function useFonts(fontMap) {
  let [fontsLoaded, setFontsLoaded] = useState(false);
  (async () => {
    await Font.loadAsync(fontMap);
    setFontsLoaded(true);
  })();
  return [fontsLoaded];
}

export default () => {
  let [fontsLoaded] = useFonts({
    'Inter-Black': 'https://rsms.me/inter/font-files/Inter-Black.otf?v=3.12',
    'Inter-SemiBoldItalic': 'https://rsms.me/inter/font-files/Inter-SemiBoldItalic.otf?v=3.12',
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  } else {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Platform Default</Text>
        <Text style={{ fontFamily: 'Inter-Black' }}>Inter Black</Text>
        <Text style={{ fontFamily: 'Inter-SemiBoldItalic' }}>Inter SemiBoldItalic</Text>
      </View>
    );
  }
};
```

</SnackInline>

## More on Font Formats

The two officially supported font formats for the Expo platform are OTF and TTF.

You should use one of those formats whenever you can. If your font is in another format, try to convert it to
one of those formats.

These are the only font formats that work consistently in Expo across web, Android, and iOS.

If you have both OTF and TTF versions of a font, prefer OTF. OTF is a newer format and `.otf` files are often
smaller than `.ttf` files and sometimes OTF files will render slightly better in certain contexts. In general,
both formats are very similar and perfectly acceptable.

## Even More on Font Formats

You may need to fiddle with the Metro bundler options to get anything other than TTF and OTF to work. In general, just don't do that unless you are really sure you want to. Trying to render a font format that a
platform doesn't support will sometimes cause your app to crash.

But, for reference, here is a table of which formats work on which platforms.

| Format | Web | iOS | Android |
| ------ | --- | --- | ------- |
| ttf    | ✅  | ✅  | ✅      |
| otf    | ✅  | ✅  | ✅      |
| woff   | ✅  | ✅  |         |
| woff2  | ✅  | ✅  |         |
| dfont  |     |     | ✅      |
| svg    | ✳️  |     |         |
| eot    | ✳️  |     |         |
| fon    |     |     |         |
| bdf    |     |     |         |
| ps     |     |     |         |
| ttc    |     |     |         |

## Platform Built-in Fonts

If you don't want to use a custom font, your best bet is to just use the platform default font by not specifying a font family. Each platform that Expo apps support has a different set of fonts available by default, so there's no good way to specify one that will work everywhere without supplying your own custom font.

If you are curious, [Nader Dabit](https://twitter.com/dabit3) maintains a [list of fonts always available on iOS and Android](https://github.com/react-native-training/react-native-fonts).

And on web, there are a number of generic font families that you can specify. Different users, browsers, and operating systems will be configured to use different fonts for each of these font family specifications. For example, Safari on an iPhone will use San Francisco as its default for `sans-serif` while Microsoft Edge on Windows will use Arial, and Chrome on Android will typically use Roboto, though OnePlus phones will often use Slate, etc., etc..

- `sans-serif`
- `serif`
- `monospace`
- `fantasy`
- `cursive`

In general, your safest bets are just to use the system default which will usually be an easy-to-read sans serif font that the user of any system should be familiar with; or to use your own custom font so you have precise control over what the user will see.
