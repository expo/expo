---
title: Asset Caching
---

import SnackInline from '~/components/plugins/SnackInline';

This section covers all things related to loading assets in your apps, from bundling with an app binary, to caching, pre-loading and publishing.

### Bundling Assets

Bundling assets into your binary will provide for the best user experience as your assets will be available immediately. Instead of having to make a network request to the CDN to fetch your published assets, your app will fetch them from the local disk resulting in a faster, more efficient loading experience. Bundling assets also allows offline functionality.

To bundle assets in your binary, use the [assetBundlePatterns](../workflow/configuration.md) key in **app.json** to provide a list of paths in your project directory:

```
"assetBundlePatterns": [
  "assets/images/*"
],
```

Images with paths matching the given patterns will be bundled into your native binaries next time you run `eas build` (or `expo build` if you are using the classic build service).

> **Note**: If your app contains an abnormal amount of assets or assets that are abnormally large in size, asset bundling may not be the best solution as it will cause your application size to bloat. If this is the case, be selective and bundle those assets that are essential and store the rest on the CDN.

### Pre-loading and Caching Assets

Assets are cached differently depending on where they are stored and how they are used. This section offers best practices to ensure you only download assets when needed. To keep the loading screen visible while caching assets, it's a good idea to render a [SplashScreen](/versions/latest/sdk/splash-screen/) until everything is ready.

To download and cache the images saved to the local filesystem, use [`Asset.fromModule(image).downloadAsync()`](/versions/latest/sdk/asset). For images with remote URLs, use `Image.prefetch(image)`.

Fonts are pre-loaded using `Font.loadAsync(font)`. The `font` argument in this method is an object such as: `{OpenSans: require('./assets/fonts/OpenSans.ttf')}`. `@expo/vector-icons` provides a helpful shortcut for this object as `FontAwesome.font` in the following example:

<SnackInline
label="Pre-loading and Caching Assets"
dependencies={['expo-font', 'expo-asset', 'expo-splash-screen', '@expo/vector-icons', '@expo/vector-icons/FontAwesome']}
files={{'assets/images/circle.jpg': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/42f59672cb9eb70368b00921c0cc60b7'}}>

```jsx
import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { Asset } from 'expo-asset';
import FontAwesome from '@expo/vector-icons/FontAwesome';

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

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  // Load any resources or data that you need prior to rendering the app
  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        SplashScreen.preventAutoHideAsync();

        const imageAssets = cacheImages([
          'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
          require('./assets/images/circle.jpg'),
        ]);

        const fontAssets = cacheFonts([FontAwesome.font]);

        await Promise.all([...imageAssets, ...fontAssets]);
      } catch (e) {
        // You might want to provide this error information to an error reporting service
        console.warn(e);
      } finally {
        setAppIsReady(true);
        SplashScreen.hideAsync();
      }
    }

    loadResourcesAndDataAsync();
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text>Hello world, this is my app.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

</SnackInline>

To use the local image asset, you can continue referencing the source of the image normally in your project, for example:

```jsx
<Image source={require('path/to/image.png')} />
```

See the complete working example in [Expo's tabs template project](https://github.com/expo/expo/blob/main/templates/expo-template-tabs/App.tsx). You can also run `npx create-expo-app --template tabs` to set up a local project with the same template.

### Publishing Assets

When you publish your project, it will upload your assets to the CDN so that they may be fetched when users run your app. However, in order for assets to be uploaded to the CDN they must be explicitly required somewhere in your application's code. Conditionally requiring assets will result in the bundler being unable to detect them and therefore they will not be uploaded when you publish your project.

### Optimizing Assets

You can manually optimize your assets by running the command `npx expo-optimize` which will use the [sharp](https://sharp.pixelplumbing.com/en/stable/) library to compress your assets. You can set the quality of the compression by passing the `--quality [number]` option to the command. For example, to compress to `90%` you would run `npx expo-optimize --quality 90`.
