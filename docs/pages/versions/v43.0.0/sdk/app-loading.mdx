---
title: AppLoading
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-43/packages/expo-app-loading'
---

import APISection from '~/components/plugins/APISection';
import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`expo-app-loading`** tells `expo-splash-screen` to keep the splash screen visible while the AppLoading component is mounted.

This is useful to download and cache fonts, logos, icon images and other assets that you want to be sure the user has on their device for an optimal experience.

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="expo-app-loading" />

## Usage

{/* prettier-ignore */}
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

    /* @info Read more about <a href='../archive/classic-updates/preloading-and-caching-assets.html'>Preloading and Caching Assets</a> */
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

<APISection packageName="expo-app-loading" apiName="AppLoading" />
