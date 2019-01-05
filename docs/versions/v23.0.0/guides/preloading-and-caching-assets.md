---
title: Preloading & Caching Assets
---

In order to keep the loading screen visible while we cache our assets, we render [Expo.AppLoading](../../sdk/app-loading/#app-loading) and only that component until everything is ready.

For images that we have saved to our local filesytem, we can use `Expo.Asset.fromModule(image).downloadAsync()` to download and cache the image. For web images, we can use `Image.prefetch(image)`. Continue referencing the image normally, eg. with `<Image source={require('path/to/image.png')} />`.

Fonts are preloaded using `Expo.Font.loadAsync(font)`. The `font`
argument in this case is an object such as the following: `{OpenSans:
require('./assets/fonts/OpenSans.ttf')}`. `@expo/vector-icons` provides a helpful shortcut for this object, which you see below as `FontAwesome.font`.

```javascript
import React from 'react';
import { AppLoading, Asset, Font } from 'expo';
import { View, Text, Image } from 'react-native';
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