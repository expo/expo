---
title: Font
sourceCodeUrl: 'https://github.com/expo/expo/tree/main/packages/expo-font'
packageName: 'expo-font'
---

import APISection from '~/components/plugins/APISection';
import {APIInstallSection} from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

`expo-font` allows loading fonts from the web and using them in React Native components. See more detailed usage information in the [Fonts](/guides/using-custom-fonts) guide.

<PlatformsSection android emulator ios simulator web />

## Installation

<APIInstallSection />

## Usage

### Example: hook

<SnackInline label="Minimal Example of Using Custom Font" dependencies={['expo-font', 'expo-splash-screen']} files={{ 'assets/fonts/Inter-Black.otf': 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/44b1541a96341780b29112665c66ac67' }}>

```jsx
import { useEffect, useCallback } from 'react';
import { Text, View, StyleSheet } from 'react-native';
/* @info Import useFonts hook from 'expo-font'. */
import { useFonts } from 'expo-font';
/* @end */
/* @info Also, import SplashScreen so that when the fonts are not loaded, we can continue to show SplashScreen. */
import * as SplashScreen from 'expo-splash-screen';
/* @end */

export default function App() {
  const [fontsLoaded] = useFonts({
    'Inter-Black': require('./assets/fonts/Inter-Black.otf'),
  });

  useEffect(() => {
    /* @info This asynchronous function prevents SplashScreen from auto hiding while the fonts are loaded. */
    async function prepare() {
      await SplashScreen.preventAutoHideAsync();
    }
    /* @end */

    prepare();
  }, []);

  /* @info After the custom fonts have loaded, we can hide the splash screen and display the app screen. */
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);
  /* @end */

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <Text style={{ fontFamily: 'Inter-Black', fontSize: 30 }}>Inter Black</Text>
      <Text style={{ fontSize: 30 }}>Platform Default</Text>
    </View>
  );
}

/* @hide const styles = StyleSheet.create({ ... }); */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
/* @end */
```

</SnackInline>

## API

```js
import * as Font from 'expo-font';
```

<APISection packageName="expo-font" />

## Error Codes

| Code                | Description                                                       |
| ------------------- | ----------------------------------------------------------------- |
| ERR_FONT_API        | If the arguments passed to `loadAsync` are invalid.               |
| ERR_FONT_SOURCE     | The provided resource was of an incorrect type.                   |
| ERR_WEB_ENVIRONMENT | The browser's `document` element doesn't support injecting fonts. |
| ERR_DOWNLOAD        | Failed to download the provided resource.                         |
| ERR_FONT_FAMILY     | Invalid font family name was provided.                            |
| ERR_UNLOAD          | Attempting to unload fonts that haven't finished loading yet.     |
