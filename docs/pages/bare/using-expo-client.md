---
title: Custom native code in Expo Go
sidebar_title: Using Expo Go
---

import { Terminal } from '~/ui/components/Snippet';
import { BoxLink } from '~/ui/components/BoxLink';
import { InlineCode } from '~/components/base/code';
import SnackInline from '~/components/plugins/SnackInline'

The [Expo Go][expo-go] app is capable of running most React Native apps regardless of how they are bootstrapped. Developing any React Native app in Expo Go is useful because you can distribute your project instantly to the members of your [organization](/accounts/account-types/#organizations), and no native build or provisioning is required.

The main drawback of developing in Expo Go is that it is impossible to send custom native code over-the-air to the Expo Go app. This means you will need to do one of the following:

1. Create a [development build](/development/introduction) to use custom native code, and distribute it with [internal distribution](/build/internal-distribution) or TestFlight.
2. Conditionally disable unsupported native features and distribute with Expo Go.

This guide will demonstrate achieving the second option by compatible library versions, detecting whether the code is running in an Expo Go app at run time, native module detection, and so on.

## Usage

Inside any React Native app, start a [development server with Expo CLI](/workflow/expo-cli#develop):

<Terminal cmd={["$ npx expo start"]} />

<BoxLink title={<>Don't have <InlineCode>npx expo start</InlineCode>?</>} href="/bare/installing-expo-modules" description={<>Install and configure the <InlineCode>expo</InlineCode> package in your project.</>} />

Then, launch your app in Expo Go by pressing <kbd>i</kbd> or <kbd>a</kbd> in the Terminal UI. Some features may cause your app to throw errors because certain native code is missing, continue reading to learn how you can conditionally skip unsupported APIs.

> Unlike `npx react-native start` the command `npx expo start` hosts an app manifest that dev clients like Expo Go can use to load arbitrary projects. Think of an app manifest like the `<head />` element of an `index.html` but for React Native apps. To view this manifest, visit the dev server URL in your web browser.

## Installing libraries

Ensure your app uses the most compatible library versions for the project's `react-native` version. This means that use `npx expo install` instead of `npm install` to install libraries. Read more about [`npx expo install`](/workflow/expo-cli#install).

## Runtime detection

The easiest way to detect where the JavaScript bundle is running is to check the [`Constants.executionEnvironment`](/versions/latest/sdk/constants/#nativeconstants--properties).

<Terminal cmd={[ "$ npx expo install expo-constants"]} />

```tsx
import Constants, { ExecutionEnvironment } from 'expo-constants';

// `true` when running in Expo Go.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
```

You can use this boolean to conditionally require custom native code. Here's an example using the library `react-native-blurhash` which is not available in the Expo Go app:

<SnackInline dependencies={['expo-constants', 'react-native-blurhash']}>

```js
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// `true` when running in Expo Go.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Blurhash;
// Create a fallback for Expo Go
if (isExpoGo) {
  Blurhash = props => (
    <View
      style={[
        {
          backgroundColor: 'lightblue',
          alignItems: 'center',
          justifyContent: 'center',
        },
        props.style,
      ]}>
      <Text>(Blurhash not available)</Text>
    </View>
  );
} else {
  // Conditionally require this module to prevent Metro from throwing warnings.
  Blurhash = require('react-native-blurhash').Blurhash;
}

export default function App() {
  return <Blurhash blurhash="LGFFaXYk^6#M@-5c,1J5@[or[Q6." style={{ flex: 1 }} />;
}
```

</SnackInline>

If you run this code in the Expo Go app, you'll see the fallback view. If you are able to build this locally with the [Expo CLI run commands](/workflow/expo-cli#compiling) then you'll see the native blur hash view.

## Native module detection

Native modules are added to the JavaScript global object at the runtime. This means you can conditionally check if they exist to ensure functionality:

```js
import { NativeModules } from 'react-native';

const isAvailable = !!NativeModules.MyAnalytics;
```

The above code snippet ensures the native module _must_ be installed and linked. However, there are two issues with this solution:

1. You need to know the native module name ahead of time.
2. You likely want an error to be thrown when a native module is missing in a custom build. This helps you determine if there is a native linking issue.

## Optional imports

Optional imports are supported by [Metro bundler](/guides/customizing-metro). They refer to wrapping a `require` statement with a `try/catch` to prevent an error from being thrown when the requested module is missing:

<SnackInline dependencies={['expo-constants', 'react-native-blurhash']}>

```js
import React from 'react';
import { View } from 'react-native';

let Blurhash;

try {
  Blurhash = require('react-native-blurhash').Blurhash;
} catch {
  Blurhash = View;
}

export default function App() {
  return <Blurhash blurhash="LGFFaXYk^6#M@-5c,1J5@[or[Q6." style={{ flex: 1 }} />;
}
```

</SnackInline>

This method is the least reliable because there are several reasons that a `require` statement might throw an error. For example, there could be an internal error, the module could be missing, the native module could be linked incorrectly, and so on. You should avoid using this method.

## Deprecated `.expo` extensions

The `.expo.[js/json/ts/tsx]` extensions to provide Expo Go specific fallbacks are removed in favor of optional imports syntax. For more information, see [Migration off the expo file extension](https://github.com/expo/fyi/blob/main/expo-extension-migration.md#after).

[expo-go]: https://expo.dev/expo-go
