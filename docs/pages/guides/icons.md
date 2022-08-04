---
title: Icons
---

import SnackInline from '~/components/plugins/SnackInline';
import SnackEmbed from '~/components/plugins/SnackEmbed';

As trendy as it is these days, not every app has to use emojis for all icons -- maybe you want to pull in a popular set through an icon font like FontAwesome, Glyphicons or Ionicons, or you just use some PNGs that you carefully picked out on [The Noun Project](https://thenounproject.com/). Let's look at how to do both of these approaches.

## @expo/vector-icons

This library is installed by default on the template project using `npx create-expo-app` and is part of the `expo` package. It is built on top of [react-native-vector-icons](https://github.com/oblador/react-native-vector-icons) and uses a similar API. It includes popular icon sets that you can browse at [icons.expo.fyi](https://icons.expo.fyi).

In the example below, the component loads the `Ionicons` font, and renders a checkmark icon.

<SnackEmbed snackId="@amanhimself/expo-vector-icons-ionicons-example" preview platform="web" />

> **Note:** As with [any custom font](using-custom-fonts.md#using-custom-fonts) in Expo, you may want to preload icon fonts before rendering your app. The font object is available as a static property on the font component, so in the case above it is `Ionicons.font`, which evaluates to `{ionicons: require('path/to/ionicons.ttf')}`. [Read more on how to preload assets and cache them](preloading-and-caching-assets#pre-loading-and-caching-assets).

## Custom Icon Fonts

To use a custom icon font, you have to make sure you import them into your project. Only after a font has loaded, you can create an Icon set. [Learn more about loading custom fonts](using-custom-fonts.md).

`@expo/vector-icons` exposes three methods to help you create an icon set:

### createIconSet

This method returns your own custom font based on the `glyphMap` where the key is the icon name and the value is either a UTF-8 character or it's character code.

In the example below, the `glyphMap` object is defined which is then passed as the first argument to the `createIconSet` method. The second argument,`fontFamily`, is the name of the font (not the filename). Optionally, you can pass the third argument for Android support, which is the custom font file name.

```jsx
import * as React from 'react';
import * as Font from 'expo-font';
import { createIconSet } from '@expo/vector-icons';

const glyphMap = { 'icon-name': 1234, test: '∆' };
const CustomIcon = createIconSet(glyphMap, 'fontFamily', 'custom-icon-font.ttf');

export default function CustomIconExample() {
  return <CustomIcon name="icon-name" size={32} color="red" />;
}
```

### createIconSetFromIcoMoon

The `@expo/vector-icons` library provides `createIconSetFromIcoMoon` method to create a custom font based on an [IcoMoon](https://icomoon.io/) config file. You have to save the **selection.json** and **.ttf** somewhere convenient in your project, preferably in the `assets/*` folder, and then load the font using either `useFonts` hook or `Font.loadAsync` method from `expo-font`.

See the example below that uses the `useFonts` hook to load the font:

<SnackEmbed snackId="@amanhimself/create-icon-set-from-ico-moon" preview platform="web" />

### createIconSetFromFontello

The `@expo/vector-icons` library provides `createIconSetFromIcoMoon` method to create a custom font based on an [Fontello](http://fontello.com/) config file. You have to save the **config.json** and **.ttf** somewhere convenient in your project, preferably in the `assets/*` folder, and then load the font using either `useFonts` hook or `Font.loadAsync` method from `expo-font`.

It follows the similar configuration as `createIconSetFromIcoMoon` as shown in the example:

```javascript
// Import the createIconSetFromFontello method
import { createIconSetFromFontello } from '@expo/vector-icons';

// Import the config file
import fontelloConfig from './config.json';

// Both the font name and files exported from Fontello are most likely called "fontello"
const Icon = createIconSetFromFontello(fontelloConfig, 'fontello', 'fontello.ttf');
```

## Icon images

You can use the `Image` component from React Native to display an icon. The `source` prop takes the relative path to refer the image.

<SnackEmbed snackId="@amanhimself/image-icons-expo-example" preview platform="web" />

You can also provide different versions of your icon at various pixel densities. The `Image` component takes care of using the image with appropriate pixel density automatically. For example, if the image has variants like `icon@2x.png` and `icon@3x.png`, the `@2x` suffix is served for a device's screen density such as iPhone 7 and the `@3x` suffix is served for a device's screen density such as iPhone 7 Plus. [You can learn more about serving different densities in React Native documentation](https://reactnative.dev/docs/images#static-image-resources).

## Button Component

You can create an Icon Button using the `Font.Button` syntax where the `Font` is the icon set that you import from `@expo/vector-icons`.

In the example below, a login button uses the `FontAwesome` icon set. Notice that the `FontAwesome.Button` component accepts props to handle action when a button is pressed and can wrap the text of the button.

<SnackEmbed snackId="@amanhimself/icon-button-expo-example" preview platform="web" />

### Properties

Any [`Text`](http://reactnative.dev/docs/text), [`TouchableHighlight`](http://reactnative.dev/docs/touchablehighlight) or [`TouchableWithoutFeedback`](http://reactnative.dev/docs/touchablewithoutfeedback) property in addition to these:

| Prop                  | Description                                                                                                                                       | Default             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| **`color`**           | Text and icon color, use `iconStyle` or nest a `Text` component if you need different colors.                                                     | `white`             |
| **`size`**            | Icon size.                                                                                                                                        | `20`                |
| **`iconStyle`**       | Styles applied to the icon only, good for setting margins or a different color. _Note: use `iconStyle` for margins or expect unstable behaviour._ | `{marginRight: 10}` |
| **`backgroundColor`** | Background color of the button.                                                                                                                   | `#007AFF`           |
| **`borderRadius`**    | Border radius of the button, set to `0` to disable.                                                                                               | `5`                 |
| **`onPress`**         | A function called when the button is pressed.                                                                                                     | _None_              |
