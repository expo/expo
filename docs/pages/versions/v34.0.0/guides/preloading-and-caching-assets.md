---
title: Preloading & Caching Assets
---

Assets are cached differently depending on where they're stored and how they're used. This guide offers best practices for making sure you only download assets when you need to. In order to keep the loading screen visible while caching assets, it's also a good idea to render [AppLoading](../../sdk/app-loading/#app-loading) and only that component until everything is ready. See also: [Offline Support](../offline-support/).

For images that saved to the local filesytem, use [`Asset.fromModule(image).downloadAsync()`](../../sdk/asset/) to download and cache the image. There is also a [loadAsync()](../../sdk/asset/#expoassetloadasyncmodules) helper method to cache a batch of assets.

For web images, use `Image.prefetch(image)`. Continue referencing the image normally, e.g. with `<Image source={require('path/to/image.png')} />`.

Fonts are preloaded using `Font.loadAsync(font)`. The `font`
argument in this case is an object such as the following: `{OpenSans:
require('./assets/fonts/OpenSans.ttf')}`. `@expo/vector-icons` provides a helpful shortcut for this object, which you see below as `FontAwesome.font`.

```javascript
import * as React from 'react';
import { View, Text, Image } from 'react-native';
import { AppLoading } from 'expo';
import * as Font from 'expo-font';
import { Asset } from 'expo-asset';
import { FontAwesome } from '@expo/vector-icons';

function cacheImages(images) {
  return images.map(image => {
    if (typeof image === 'string') {
      return Image.prefetch(image);
    } else {
      return Asset.fromModule(image).downloadAsync();
    }
  });
}

function cacheFonts(fonts) {
  return fonts.map(font => Font.loadAsync(font));
}

export default class AppContainer extends React.Component {
  state = {
    isReady: false,
  };

  async _loadAssetsAsync() {
    const imageAssets = cacheImages([
      'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
      require('./assets/images/circle.jpg'),
    ]);

    const fontAssets = cacheFonts([FontAwesome.font]);

    await Promise.all([...imageAssets, ...fontAssets]);
  }

  render() {
    if (!this.state.isReady) {
      return (
        <AppLoading
          startAsync={this._loadAssetsAsync}
          onFinish={() => this.setState({ isReady: true })}
          onError={console.warn}
        />
      );
    }

    return (
      <View>
        <Text>Hello world, this is my app.</Text>
      </View>
    );
  }
}
```

See a full working example in [github/expo/new-project-template](https://github.com/expo/new-project-template/blob/master/App.js).
