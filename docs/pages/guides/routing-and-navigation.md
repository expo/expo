---
title: Routing & Navigation
---

import { BoxLink } from '~/ui/components/BoxLink';
import Video from '~/components/plugins/Video'
import { Collapsible } from '~/ui/components/Collapsible';
import SnackInline from '~/components/plugins/SnackInline'

Routing and navigation refers to the ability to organize your app into distinct screens, map screens to URLs, move between those screens, and display the appropriate platform-specific navigation-related user interface elements (eg: tabs, navigation bar, screen transition animations and gestures, drawers).

For navigation, use [React Navigation](https://github.com/react-navigation/react-navigation). React Navigation is the most popular navigation library in the React Native ecosystem, it is maintained by the Expo team, and supports iOS, Android, and web.

<Video file={"routing-and-navigation/preview.mp4"} loop={false} />

> This video demonstrates using React Navigation on iOS, Android, and web. Notice that it adapts to the platform conventions in each case. The code that powers this example app is available on GitHub in [react-navigation/example](https://github.com/react-navigation/react-navigation/tree/main/example).

React Navigation includes support for common navigation patterns like stacks, tabs, and drawers. It's also built to be customizable, so you can achieve any navigation pattern that you wish with it, even if it's not built-in to the library. It supports using the platform native APIs via [`createNativeStackNavigator`](https://reactnavigation.org/docs/native-stack-navigator), this is commonly referred to in React Native as "native navigation".

## Usage

1. Install React Navigation in your project, refer to the ["Getting started" guide](https://reactnavigation.org/docs/getting-started/).
2. Read the "Fundamentals" section of the React Navigation docs, starting with ["Hello React Navigation"](https://reactnavigation.org/docs/hello-react-navigation).

<SnackInline dependencies={['@react-navigation/native', '@react-navigation/native-stack', 'react-native-screens', 'react-native-safe-area-context']}>

```js
import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

function HomeScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Home Screen</Text>
    </View>
  );
}

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
```

</SnackInline>

## Next

<BoxLink title="Linking" description="Create links and handle incoming URL requests for your app." href="/guides/linking" />
<BoxLink title="Deep linking" description="Connect an app to a website to enable universal links and deep links." href="/guides/deep-linking" />
<BoxLink title="React Navigation linking" description="Forward URLs to React Navigation screens." href="https://reactnavigation.org/docs/configuring-links" />

## FAQ

<Collapsible summary="Can I use Next.js routing for web?">

Yes, you can use [Next.js](/guides/using-nextjs) routing for web. You can read more about this in [Using Next.js with Expo for Web](/guides/using-nextjs).

</Collapsible>

<Collapsible summary="Can I use React Native Navigation by Wix?">
 
- React Native Navigation is not available in the Expo Go app.
- Usage with Prebuild will require a [config plugin](/guides/config-plugins), there is an [open issue](https://github.com/wix/react-native-navigation/issues/7534) on the React Native Navigation repo to track this.
- For platform-specific native navigation (less cross-platform), we recommend using [`createNativeStackNavigator`](https://reactnavigation.org/docs/native-stack-navigator) from React Navigation.

</Collapsible>
