---
title: SplashScreen
sourceCodeUrl: 'https://github.com/expo/expo/blob/sdk-36/packages/expo/src/launch/SplashScreen.ts'
---

import PlatformsSection from '~/components/plugins/PlatformsSection';

The `SplashScreen` module tells Expo to keep the splash screen visible until you choose to hide it. This is useful to do some work behind the scenes before displaying your app and to create transitions for your splash screen, so you can have it fade out or slide away, for example.

This is useful to let you create an impression of a pure React component splash screen. You can combine it with [AppLoading](app-loading.md). Read more about [creating a splash screen.](../../../guides/splash-screens.md)

<PlatformsSection android emulator ios simulator web />

## Installation

This API is pre-installed in [managed](../../../introduction/managed-vs-bare.md#managed-workflow) apps. It is not available for [bare](../../../introduction/managed-vs-bare.md#bare-workflow) React Native apps.

## API

```js
import { SplashScreen } from 'expo';
```

### `SplashScreen.preventAutoHide()`

Makes the native splash screen (configured in `app.json`) stay visible until `hide` is called.

### `SplashScreen.hide()`

Hides the native splash screen.

## Example with AppLoading

```javascript
import React from 'react';
import { Image, Text, View } from 'react-native';
import { AppLoading, SplashScreen } from 'expo';
import { Asset } from 'expo-asset';

export default class App extends React.Component {
  state = {
    isSplashReady: false,
    isAppReady: false,
  };

  render() {
    if (!this.state.isSplashReady) {
      return (
        <AppLoading
          startAsync={this._cacheSplashResourcesAsync}
          onFinish={() => this.setState({ isSplashReady: true })}
          onError={console.warn}
          autoHideSplash={false}
        />
      );
    }

    if (!this.state.isAppReady) {
      return (
        <View style={{ flex: 1 }}>
          <Image
            source={require('./assets/images/splash.gif')}
            onLoad={this._cacheResourcesAsync}
          />
        </View>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <Image source={require('./assets/images/expo-icon.png')} />
        <Image source={require('./assets/images/slack-icon.png')} />
      </View>
    );
  }

  _cacheSplashResourcesAsync = async () => {
    const gif = require('./assets/images/splash.gif');
    return Asset.fromModule(gif).downloadAsync();
  };

  _cacheResourcesAsync = async () => {
    SplashScreen.hide();
    const images = [
      require('./assets/images/expo-icon.png'),
      require('./assets/images/slack-icon.png'),
    ];

    const cacheImages = images.map(image => {
      return Asset.fromModule(image).downloadAsync();
    });

    await Promise.all(cacheImages);
    this.setState({ isAppReady: true });
  };
}
```

## Example without AppLoading

```javascript
import React from 'react';
import { Image, Text, View } from 'react-native';
import { SplashScreen } from 'expo';
import { Asset } from 'expo-asset';

export default class App extends React.Component {
  state = {
    isReady: false,
  };

  componentDidMount() {
    SplashScreen.preventAutoHide();
  }

  render() {
    if (!this.state.isReady) {
      return (
        <View style={{ flex: 1 }}>
          <Image
            source={require('./assets/images/splash.gif')}
            onLoad={this._cacheResourcesAsync}
          />
        </View>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <Image source={require('./assets/images/expo-icon.png')} />
        <Image source={require('./assets/images/slack-icon.png')} />
      </View>
    );
  }

  _cacheSplashResourcesAsync = async () => {
    const gif = require('./assets/images/splash.gif');
    return Asset.fromModule(gif).downloadAsync();
  };

  _cacheResourcesAsync = async () => {
    SplashScreen.hide();
    const images = [
      require('./assets/images/expo-icon.png'),
      require('./assets/images/slack-icon.png'),
    ];

    const cacheImages = images.map(image => {
      return Asset.fromModule(image).downloadAsync();
    });

    await Promise.all(cacheImages);
    this.setState({ isReady: true });
  };
}
```

## Example without any flickering between SplashScreen and its later continuation

```javascript
import React from 'react';
import { Image, Text, View } from 'react-native';
import { AppLoading, SplashScreen } from 'expo';
import { Asset } from 'expo-asset';

export default class App extends React.Component {
  state = { areResourcesReady: false };

  constructor(props) {
    super(props);
    SplashScreen.preventAutoHide(); // Instruct SplashScreen not to hide yet
  }

  componentDidMount() {
    this.cacheResourcesAsync() // ask for resources
      .then(() => this.setState({ areResourcesReady: true })) // mark resources as loaded
      .catch(error => console.error(`Unexpected error thrown when loading:\n${error.stack}`));
  }

  render() {
    if (!this.state.areResourcesReady) {
      return null;
    }

    return (
      <View style={{ flex: 1 }}>
        <Image
          style={{ flex: 1, resizeMode: 'contain', width: undefined, height: undefined }}
          source={require('./assets/splash.png')}
          onLoadEnd={() => {
            // wait for image's content to fully load [`Image#onLoadEnd`] (https://reactnative.dev/docs/image#onloadend)
            console.log('Image#onLoadEnd: hiding SplashScreen');
            SplashScreen.hide(); // Image is fully presented, instruct SplashScreen to hide
          }}
          fadeDuration={0} // we need to adjust Android devices (https://reactnative.dev/docs/image#fadeduration) fadeDuration prop to `0` as it's default value is `300`
        />
      </View>
    );
  }

  async cacheResourcesAsync() {
    const images = [require('./assets/splash.png')];
    const cacheImages = images.map(image => Asset.fromModule(image).downloadAsync());
    return Promise.all(cacheImages);
  }
}
```
