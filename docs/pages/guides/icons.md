---
title: Icons
---

As trendy as it is these days, not every app has to use emoji for all icons 😳 -- maybe you want to pull in a popular set through an icon font like FontAwesome, Glyphicons or Ionicons, or you just use some PNGs that you carefully picked out on [The Noun Project](https://thenounproject.com/). Let's look at how to do both of these approaches.

## @expo/vector-icons

This library is installed by default on the template project that get through `expo init` -- it is part of the `expo` package. It includes popular icon sets and you can browse all of the icons using the [@expo/vector-icons directory](https://expo.github.io/vector-icons/).

```javascript
import * as React from 'react';
import { Ionicons } from '@expo/vector-icons';

export default class IconExample extends React.Component {
  render() {
    return <Ionicons name="md-checkmark-circle" size={32} color="green" />;
  }
}
```

This component loads the Ionicons font if it hasn't been loaded already, and renders a checkmark icon that I found through the vector-icons directory mentioned above. `@expo/vector-icons` is built on top of [react-native-vector-icons](https://github.com/oblador/react-native-vector-icons) and uses a similar API. The only difference is `@expo/vector-icons` uses a more idiomatic `import` style:

`import { Ionicons } from '@expo/vector-icons';` instead of.. `import Ionicons from 'react-native-vector-icons/Ionicons';`.

> **Note:** As with [any custom font](using-custom-fonts.md#using-custom-fonts) in Expo, you may want to preload icon fonts before rendering your app. The font object is available as a static property on the font component, so in the case above it is `Ionicons.font`, which evaluates to `{ionicons: require('path/to/ionicons.ttf')}`. [Read more about preloading assets](preloading-and-caching-assets.md).

## Custom Icon Fonts

First, make sure you import your custom icon font. [Read more about loading custom fonts](using-custom-fonts.md#using-custom-fonts). Once your font has loaded, you'll need to create an Icon Set. `@expo/vector-icons` exposes three methods to help you create an icon set.

### createIconSet

Returns your own custom font based on the `glyphMap` where the key is the icon name and the value is either a UTF-8 character or it's character code. `fontFamily` is the name of the font **NOT** the filename. The `expoAssetId` can be anything that you can pass in to [Font.loadAsync](../versions/latest/sdk/font.md#fontloadasyncobject). See [react-native-vector-icons](https://github.com/oblador/react-native-vector-icons/blob/master/README.md#custom-fonts) for more details.

```javascript
import * as React from 'react';
import * as Font from 'expo-font';
import { createIconSet } from '@expo/vector-icons';

const glyphMap = { 'icon-name': 1234, test: '∆' };
const CustomIcon = createIconSet(glyphMap, 'FontName', 'custom-icon-font.ttf');

export default class CustomIconExample extends React.Component {
  render() {
    return <CustomIcon name="icon-name" size={32} color="red" />;
  }
}
```

### createIconSetFromFontello

Convenience method to create a custom font based on a [Fontello](http://fontello.com/) config file. Don't forget to import the font as described above and drop the `config.json` somewhere convenient in your project, using `Font.loadAsync`.

```javascript
// Once your custom font has been loaded...
import { createIconSetFromFontello } from '@expo/vector-icons';
import fontelloConfig from './config.json';
// Both the font name and files exported from Fontello are most likely called "fontello"
const Icon = createIconSetFromFontello(fontelloConfig, 'fontello', 'fontello.ttf');
```

### createIconSetFromIcoMoon

Convenience method to create a custom font based on an [IcoMoon](https://icomoon.io/) config file. Don't forget to import the font as described above and drop the `config.json` somewhere convenient in your project, using `Font.loadAsync`.

```javascript
// Once your custom font has been loaded...
import { createIconSetFromIcoMoon } from '@expo/vector-icons';
import icoMoonConfig from './config.json';
const Icon = createIconSetFromIcoMoon(icoMoonConfig, 'FontName', 'custom-icon-font.ttf');
```

## Icon images

If you know how to use the react-native `<Image>` component this will be a breeze.

```javascript
import React from 'react';
import { Image } from 'react-native';

export default class SlackIcon extends React.Component {
  render() {
    return (
      <Image
        source={require('../assets/images/slack-icon.png')}
        fadeDuration={0}
        style={{ width: 20, height: 20 }}
      />
    );
  }
}
```

Let's assume that our `SlackIcon` class is located in `my-project/components/SlackIcon.js`, and our icon images are in `my-project/assets/images`, in order to refer to the image we use require and include the relative path. You can provide versions of your icon at various pixel densities and the appropriate image will be automatically used for you. In this example, we actually have `slack-icon@2x.png` and `slack-icon@3x.png`, so if I view this on an iPhone 6s the image I will see is `slack-icon@3x.png`. More on this in the [Images guide in the react-native documentation](https://reactnative.dev/docs/images.html#static-image-resources).

We also set the `fadeDuration` (an Android specific property) to `0` because we usually want the icon to appear immediately rather than fade in over several hundred milliseconds.

## Button Component

A convenience component for creating buttons with an icon on the left side.

```js
import { FontAwesome } from '@expo/vector-icons';

const myButton = (
  <FontAwesome.Button name="facebook" backgroundColor="#3b5998" onPress={this.loginWithFacebook}>
    Login with Facebook
  </FontAwesome.Button>
);
```

### Properties

Any [`Text`](http://reactnative.dev/docs/text.html), [`TouchableHighlight`](http://reactnative.dev/docs/touchablehighlight.html) or [`TouchableWithoutFeedback`](http://reactnative.dev/docs/touchablewithoutfeedback.html) property in addition to these:

| Prop                  | Description                                                                                                                                       | Default               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| **`color`**           | Text and icon color, use `iconStyle` or nest a `Text` component if you need different colors.                                                     | `white`               |
| **`size`**            | Icon size.                                                                                                                                        | `20`                  |
| **`iconStyle`**       | Styles applied to the icon only, good for setting margins or a different color. _Note: use `iconStyle` for margins or expect unstable behaviour._ | \`{marginRight: 10}\` |
| **`backgroundColor`** | Background color of the button.                                                                                                                   | `#007AFF`             |
| **`borderRadius`**    | Border radius of the button, set to `0` to disable.                                                                                               | `5`                   |
| **`onPress`**         | A function called when the button is pressed.                                                                                                     | _None_                |
