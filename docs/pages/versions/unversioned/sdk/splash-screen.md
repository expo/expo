---
title: SplashScreen
sourceCodeUrl: 'https://github.com/expo/expo/tree/master/packages/expo-splash-screen'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

The `SplashScreen` module tells the splash screen to remain visible until it has been explicitly told to hide. This is useful to do some work behind the scenes before displaying your app (eg: make API calls) and to animated your splash screen (eg: fade out or slide away, or switch from a static splash screen to an animated splash screen).

Read more about [creating a splash screen image](../../../guides/splash-screens.md), or [quickly generate an icon and splash screen on the web](https://buildicon.netlify.app/)

<PlatformsSection android emulator ios simulator />

## Installation

<InstallSection packageName="expo-splash-screen" />

## API

```js
import * as SplashScreen from 'expo-splash-screen';
```

### `SplashScreen.preventAutoHideAsync()`

Makes the native splash screen (configured in `app.json`) stay visible until `hideAsync` is called.

### `SplashScreen.hideAsync()`

Hides the native splash screen.

## Example: keep splash screen open while loading data

```js
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

export default class App extends React.Component {
  state = {
    appIsReady: false,
  };

  async componentDidMount() {
    // Prevent native splash screen from autohiding
    try {
      await SplashScreen.preventAutoHideAsync();
    } catch (e) {
      console.warn(e);
    }
    this.prepareResources();
  }

  /**
   * Method that serves to load resources and make API calls
   */
  prepareResources = async () => {
    try {
      await performAPICalls();
      await downloadAssets();
    } catch (e) {
      console.warn(e);
    } finally {
      this.setState({ appIsReady: true }, async () => {
        await SplashScreen.hideAsync();
      });
    }
  };

  render() {
    if (!this.state.appIsReady) {
      return null;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.text}>SplashScreen Demo! 👋</Text>
      </View>
    );
  }
}

// Put any code you need to prepare your app in these functions
async function performAPICalls() {}
async function downloadAssets() {}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#aabbcc',
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
});
```

## Example: switch from static to gif splash screen

```js
import React from 'react';
import { Image, Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Asset } from 'expo-asset';

export default class App extends React.Component {
  state = {
    isReady: false,
  };

  componentDidMount() {
    SplashScreen.preventAutoHideAsync();
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
    SplashScreen.hideAsync();

    try {
      const images = [
        require('./assets/images/expo-icon.png'),
        require('./assets/images/slack-icon.png'),
      ];

      const cacheImages = images.map(image => {
        return Asset.fromModule(image).downloadAsync();
      });

      await Promise.all(cacheImages);
    } catch (e) {
      console.warn(e);
    } finally {
      this.setState({ isReady: true });
    }
  };
}
```
