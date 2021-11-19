---
title: Using Expo Go in Bare Workflow
sidebar_title: Using Expo Go
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight'

It's not currently possible to include your own native code in Expo Go, so it might surprise you to learn that it is still possible to run your bare project in the Expo Go app.

Inside a freshly initialized bare project, run `expo start` and you can now run it in the client. Read on to learn more about the limitations, why you might want to still use the client in spite of the limitations, and patterns you can apply to make this work well for you.

## What are the limitations?

You will not be able to use the parts of your app that require custom native code. To run your bare app in Expo Go, you need to avoid calling any custom native code (native code that isn't included in the Expo SDK). For some apps this may mean that you won't be able to use the Expo Go app almost at all &mdash; for example, if your app depends on custom native code for something as fundamental as navigation or state management (eg: Realm or the Firebase native SDK) then not much of your app will be usable in the client. If your app only has some in app purchases, analytics, a custom map view, an AR view, and so on, then this may actually work great for you &mdash; that particular functionality would not be usable in Expo Go but the rest of the app still would be.

## Why might you want to do this?

There are a number of benefits to keeping your project runnable in the Expo Go app.

- Share your progress with stakeholders by publishing or sharing the development URL to see changes live
- Continuously deploy builds from pull requests
- No need to do native builds for iOS and Android in development because you use the Expo Go app instead
- Develop the JavaScript side of your app from any machine of your choice, eg: use Windows for iOS development if you have an iOS device
- Easily get new contributors set up on the project, only Node.js and a phone are required
- You can use `expo-cli` for a great development experience

## Practical patterns for client-compatible bare apps

### Prefer `expo install` over `npm install` to add Expo SDK packages

This will ensure that you get a version of the package that is compatible with the SDK version in your app. If you use `npm install` directly instead, you may end up with a newer version of the package that isn't supported in Expo Go yet.

### Use conditional inline requires to provide fallbacks

Picture this scenario: you need a beautiful map in your app and Google Maps just won't cut it, so you add '@react-native-mapbox-gl/maps'. Expo doesn't include this in the SDK, so you can't run any code that imports it in the Expo Go app. You can handle this by wrapping `MapView` access with a wrapper that provides a fallback in Expo Go, and otherwise uses the native Mapbox library:

```js
// MapView.js
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';

let MapView;

if (Constants.appOwnership === 'expo') {
  MapView = props => (
    <View
      style={[
        {
          backgroundColor: 'lightblue',
          alignItems: 'center',
          justifyContent: 'center',
        },
        props.style,
      ]}>
      <Text>🗺 (Mapbox not available)</Text>
    </View>
  );
} else {
  const Mapbox = require('@react-native-mapbox-gl/maps').default;
  Mapbox.setAccessToken('access-token-here');
  MapView = Mapbox.MapView;
}

export default MapView;
```

By moving the `require` directive inline we only actually execute the `MyMap` module code when we enter the `else` clause, and so we prevent ever importing the `@react-native-mapbox-gl/maps` package, which would likely throw an error due to the native module being missing in the client runtime environment.

```js
// App.js
import * as React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import MapView from './MapView';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 20, marginBottom: 10, fontWeight: '600' }}>Behold, a map! ✨</Text>
      <MapView
        style={{
          height: 300,
          width: 300,
          borderRadius: 20,
          overflow: 'hidden',
        }}
      />
      <StatusBar style="default" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

Problem solved! Now when we render the `<MapView />` component in the client, we'll fallback to a plain `View` placeholder. When we build the app in Xcode/Android Studio, we'll use the Mapbox map. You could also alternatively fallback to a map provided from `react-native-maps`, since it's included in the Expo SDK.

<ImageSpotlight alt="MapView working in an app built with Xcode and falling back to a placeholder in Expo Go" src="/static/images/expo-go-fallback.png" />

As you may have already guessed, you can apply this concept for more than just third party dependencies. For example, maybe you wrote a native module to wrap your favorite analytics library and you want to provide a mock for it within the client.

```js
// MyAnalytics.js
import { NativeModules } from 'react-native';

// Generic way of logging calls to MyAnalytics when module isn't available
const makeLogger = name => options =>
  console.log(`Called MyAnalytics.${name} with: ${JSON.stringify(options)}`);

// Get native module or use fallback logger
const MyAnalytics = NativeModules.MyAnalytics ?? {
  logEvent: makeLogger('logEvent'),
  setUser: makeLogger('setUser'),
};

// You usually want to wrap native function calls in functions on the JS side to
// provide TypeScript typing and validation.

export function logEvent(options) {
  NativeModules.MyAnalytics.logEvent(options);
}

export function setUser(options) {
  NativeModules.MyAnalytics.setUser(options);
}
```

### Alternatively, use optional imports

An alternative approach to using `expo-constants` as described above in the [conditional inline requires section](#use-conditional-inline-requires-to-provide-fallbacks) is to use `try/catch` around `require`. There's not any particularly good reason for you to use this in your application code, and it may lead to warning messages when the library throws an error on importing, but it is listed here in case you find yourself with a fitting use case.

The above **MapView.js** would change to look like the following:

```js
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

let MapView;

try {
  const Mapbox = require('@react-native-mapbox-gl/maps').default;
  Mapbox.setAccessToken('access-token-here');
  MapView = Mapbox.MapView;
} catch {
  MapView = props => (
    <View
      style={[
        {
          backgroundColor: 'lightblue',
          alignItems: 'center',
          justifyContent: 'center',
        },
        props.style,
      ]}>
      <Text>🗺 (Mapbox not available)</Text>
    </View>
  );
}

export default MapView;
```

### **Deprecated**: use the `.expo.[js/json/ts/tsx]` extension to provide Expo Go specific fallbacks

The `.expo` extension is removed in SDK 41. Consider using [conditional inline requires](#use-conditional-inline-requires-to-provide-fallbacks) instead, and read [expo.fyi/expo-extension-migration](https://expo.fyi/expo-extension-migration) for specific guidance on migrating away.
