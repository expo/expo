---
title: Using Custom Fonts
sidebar_title: Using Custom Fonts
---

import SnackInline from '~/components/plugins/SnackInline';
import { YesIcon, NoIcon } from '~/ui/components/DocIcons';
import SnackEmbed from '~/components/plugins/SnackEmbed';
import { Terminal } from '~/ui/components/Snippet';

Both iOS and Android and most desktop operating systems come with their own set of platform fonts but if you want to inject some more brand personality into your app, a well-picked font can go a long way.

As each operating system has its own set of platform fonts, if you want to produce an experience that is consistent for all users, you will want to use your own fonts in your project. This documentation covers the aspects of getting a custom font, loading it in your project and what are some of the best practices to use when the font is being loaded in your project.

## Getting a font

The first thing you need is a font file. For the purpose of a working example, we are going to use Inter Black from the free and open source [Inter font family](https://rsms.me/inter/) by Rasmus Anderson. A common convention in Expo apps is to put your fonts in an **./assets/fonts** directory, but you can put them anywhere you like.

### Supported font formats

The two officially supported font formats for the Expo platform are OTF and TTF. You should use one of those formats whenever you can. If your font is in another format, try to convert it to one of those formats.

These are the only font formats that work consistently in Expo across web, Android, and iOS.

If you have both OTF and TTF versions of a font, prefer OTF. OTF is a newer format and **.otf** files are often smaller than **.ttf** files. Sometimes OTF files render slightly better in certain contexts. In general, both formats are very similar and perfectly acceptable.

### Beyond OTF and TTF

If you need to use another format, you may need to [customize the Metro bundler configuration](/guides/customizing-metro) to get anything other than TTF and OTF to work. In general, just don't do that unless you are really sure you want to. Trying to render a font format that a platform doesn't support may, in some cases, cause your app to crash.

For reference, the following table provides what formats work on which platforms:

| Format | Web         | iOS         | Android     |
| ------ | ----------- | ----------- | ----------- |
| bdf    | <NoIcon />  | <NoIcon />  | <NoIcon />  |
| dfont  | <NoIcon />  | <NoIcon />  | <YesIcon /> |
| eot    | <YesIcon /> | <NoIcon />  | <NoIcon />  |
| fon    | <NoIcon />  | <NoIcon />  | <NoIcon />  |
| otf    | <YesIcon /> | <YesIcon /> | <YesIcon /> |
| ps     | <NoIcon />  | <NoIcon />  | <NoIcon />  |
| svg    | <YesIcon /> | <NoIcon />  | <NoIcon />  |
| ttc    | <NoIcon />  | <NoIcon />  | <NoIcon />  |
| ttf    | <YesIcon /> | <YesIcon /> | <YesIcon /> |
| woff   | <YesIcon /> | <YesIcon /> | <NoIcon />  |
| woff2  | <YesIcon /> | <YesIcon /> | <NoIcon />  |

## Using a custom font

After getting the font file, in your project, you need to install [`expo-font`](/versions/latest/sdk/font/#installation) module.

### Importing the font

After the installation step, import the `useFonts` hook from `expo-font` package in your project. The hook keeps track of the loading state of the font. When an app is initialized, the hook loads the map of fonts as shown in the example below:

```jsx
// Rest of the import statements
import { useFonts } from 'expo-font';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Inter-Black': require('./assets/fonts/Inter-Black.otf'),
  });

  // ...
}
```

Then, you can use the font on the `Text` component by using `fontFamily` style prop.

```jsx
<Text style={{ fontFamily: 'Inter-Black', fontSize: 30 }}>Inter Black</Text>
```

Alternatively, you can use [`Fonts.loadAsync`](#using--fontloadasync--instead-of-the) to load the fonts in your app.

### A minimal working example

Let's take a look at a minimal example that uses Inter font family. It uses [`useFonts` hook](/versions/latest/sdk/font/#usefonts) to import the font from **./assets/fonts** directory.

<SnackEmbed snackId="@amanhimself/minimal-fonts-example" preview platform="web" />

Inter Black is very bold and dark and pretty distinctive so you should be able to tell if you're able to get the example working right, or if something is wrong. If the platform default font looks a little different for you, that's fine; the platform default font can vary depending on the operating system and the device manufacturer (on Android).

When you load it on your device, you should see something like this:

<img src="/static/images/font-example-custom-font.jpg" style={{maxWidth: 305}} />

To create a new project including this example, run in your terminal:

<Terminal cmd={["$ npx create-react-native-app --template with-custom-font"]} />

> **Note**: The above example also uses [`expo-splash-screen`](/versions/latest/sdk/splash-screen/) package. To learn why, read about it more in the [Waiting for fonts to load](#waiting-for-fonts-to-load) section.

## Platform built-in fonts

If you don't want to use a custom font, your best bet is to use the platform default font by not specifying a font family. Each platform that Expo apps support has a different set of fonts available by default, so there's no good way to specify one that will work everywhere without supplying your own custom font.

If you are curious, [Nader Dabit](https://twitter.com/dabit3) maintains a [list of fonts always available on iOS and Android](https://github.com/react-native-training/react-native-fonts).

On web, there are a number of generic font families that you can specify. Different browsers, and operating systems are configured to use different fonts for each of these font family specifications. For example, Safari on an iPhone uses San Francisco as its default for `sans-serif` while Microsoft Edge on Windows uses Arial. Similarly, Chrome on Android uses Roboto, though OnePlus phones often use Slate, and so on.

- `sans-serif`
- `serif`
- `monospace`
- `fantasy`
- `cursive`

In general, your safest bets are just to use the system default which will usually be an easy-to-read sans-serif font that the user of any system should be familiar with; or to use your own custom font so you have precise control over what the user will see.

## Using a Google Font

Expo has first-class support for all fonts listed in [Google Fonts](https://fonts.google.com/). To use one of these, check out the [Expo Google Fonts](https://github.com/expo/google-fonts) project. With these packages, you can quickly integrate any font or font variants.

For example, to use Inter font you can install the [`@expo-google-fonts/inter`](https://www.npmjs.com/package/@expo-google-fonts/inter) package with the command below.

<Terminal cmd={["$ expo install expo-font @expo-google-fonts/inter"]} />

After that, you can integrate this in your project by using the `useFonts` hook in the root of your app.

<SnackEmbed snackId="@amanhimself/loading-google-font-example" preview platform="web" />

## Waiting for fonts to load

Since your fonts won't be ready right away, it is generally a good practice to not render anything until the font is ready. Instead, you can continue to display the Splash Screen of your app until all fonts have loaded. It is done by using [`expo-splash-screen](/versions/latest/sdk/splash-screen/) package. Refer back to the [minimal working example](#a-minimal-working-example) section on how to use it.

> **Note:** Learn more about [pre-loading and caching assets](/guides/preloading-and-caching-assets/#pre-loading-and-caching-assets) in your Expo app.

### Loading fonts on web

Sometimes, particularly on the web -- people choose to render their content in a platform default font while their custom font is loading. Alternatively, to render the rest of their content, that doesn't depend on the custom font while the font is loading. These approaches are called FOUT and FOIT and you can read a lot more about them on the web.

In general, these strategies are not recommended for Expo apps. If you include your fonts in your project, the
fonts will always be delivered to the user by the time your code is running. The one exception to this is that you may prefer to do this on the web.

## Additional information

You probably don't need to know anything beyond this point to use custom fonts effectively in your app. If you are curious or your use case has not been addressed by the above information, please continue reading.

### Loading a remote font directly from the web

In general, it's best and safest to load fonts from your local assets. If you submit to app stores, they will be bundled with the download and available immediately. You don't have to worry about CORS or other potential issues.

However, if you to load a remote font file directly from the web rather than from your project's assets, you can do it by replacing the `require('./assets/fonts/MyFont.otf')` with the URL of your font. See the below example:

<SnackEmbed snackId="@amanhimself/loading-fonts-from-an-url-example" preview platform="web" />

> ⚠️ **If loading remote fonts, make sure they are being served from an origin with CORS properly configured**. If you don't do this, your remote font might not load properly on the web platform.

### Using `Font.loadAsync` instead of the `useFonts` hook

If you don't want to use the `useFonts` hook (for example, maybe you prefer class components), you can use `Font.loadAsync` directly. Under the hood, the hook uses `Font.loadAsync` from the [`expo-font`](/versions/latest/sdk/font/) library. You can use it directly if you prefer, or if you want to have more fine-grained control over when your fonts are loaded before rendering.

<SnackEmbed snackId="@amanhimself/loading-fonts-in-class-components" preview platform="web" />
