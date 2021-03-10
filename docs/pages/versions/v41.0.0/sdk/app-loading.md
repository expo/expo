---
title: AppLoading
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-41/packages/expo/src/launch'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`expo-app-loading`** tells `expo-splash-screen` to keep the splash screen visible while the AppLoading component is mounted.

This is useful to download and cache fonts, logos, icon images and other assets that you want to be sure the user has on their device for an optimal experience.

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="expo-app-loading" />

## Usage

<!-- prettier-ignore -->
```javascript
import React from 'react';
import { Image, Text, View } from 'react-native';
import { Asset } from 'expo-asset';
import AppLoading from 'expo-app-loading';

export default class App extends React.Component {
  state = {
    isReady: false,
  };

  render() {
    if (!this.state.isReady) {
      /* @info As long as AppLoading is the only leaf/native component that has been mounted, the loading screen will remain visible */
      return (
        <AppLoading
          startAsync={this._cacheResourcesAsync}
          onFinish={() => this.setState({ isReady: true })}
          onError={console.warn}
        />
      ); /* @end */
    }

    return (
      <View style={{ flex: 1 }}>
        <Image source={require('./assets/snack-icon.png')} />
      </View>
    );
  }

  async _cacheResourcesAsync() {
    const images = [require('./assets/snack-icon.png')];

    /* @info Read more about <a href='../guides/preloading-and-caching-assets.html'>Preloading and Caching Assets</a> */
    const cacheImages = images.map(image => {
      return Asset.fromModule(image).downloadAsync();
    }); /* @end */

    return Promise.all(cacheImages);
  }
}
```

## API

```js
import AppLoading from 'expo-app-loading';
```

### props

The following props are recommended, but optional. If you do not provide any props, you are responsible for coordinating loading assets, handling errors, and updating state to unmount the `AppLoading` component.

- **startAsync (_function_)** -- A `function` that returns a `Promise`, and the `Promise` should resolve when the app is done loading required data and assets.
- **onError (_function_)** -- If `startAsync` throws an error, it is caught and passed into the function provided to `onError`.
- **onFinish (_function_)** -- **(Required if you provide `startAsync`)**. Called when `startAsync` resolves or rejects. This should be used to set state and unmount the `AppLoading` component.
- **autoHideSplash (_boolean_)** -- Whether to hide the native splash screen as soon as you unmount the AppLoading component. See [SplashScreen module](splash-screen.md) for an example.
