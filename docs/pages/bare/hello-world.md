---
title: Up and Running
sidebar_label: Up and Running
---

import TerminalBlock from '~/components/plugins/TerminalBlock';

> This guide assumes that you have Xcode and/or Android Studio installed and working. It also assumes that you want to create a new project. If you have an existing app that you would like to integrate the Expo SDK in an existing app, read the [existing apps guide](../bare/existing-apps.md).

Before you get started with a bare React Native project, make sure you set up your environment for [React Native CLI](https://reactnative.dev/docs/environment-setup).

After this, let's get started with a bare project. Run `expo init` and choose one of the bare templates. We'll use the minimum template here.

```sh
# If you don't have expo-cli yet, get it
npm i -g expo-cli
# This is a shortcut to skip the UI for picking the template
expo init --template bare-minimum
```

Next, let's get the project running. Go into your project directory and run `expo run:ios` or `expo run:android` &mdash; hurray! Your project is working.

## Using Expo modules

Bare template projects come with `expo` installed and configured, so you're ready to install and use any package from the Expo SDK.

## Install an Expo SDK package

We're going to install [`expo-web-browser`](https://github.com/expo/expo/tree/master/packages/expo-web-browser), it's a useful little package for showing a modal web browser using the appropriate native APIs on each platform.

```sh
expo install expo-web-browser
```

Open up **App.js** and add a button that, when pressed, opens up a web browser. Here's some code for you.

```tsx
import * as React from 'react';
import { Button, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

export default function App() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Button
        title="Open a web browser"
        onPress={() => {
          WebBrowser.openBrowserAsync('https://expo.dev');
        }}
      />
    </View>
  );
}
```

This will not yet work because we haven't linked the native code that powers it. To do this, we need to follow the instructions in the [`expo-web-browser` README](https://github.com/expo/expo/tree/master/packages/expo-web-browser) to configure it for iOS and Android. Let's do it.

### iOS configuration

<TerminalBlock cmd={['# Build your native iOS project', 'expo run:ios']} />

You may need to run `npx pod-install` to link the native iOS packages using [CocoaPods](https://cocoapods.org/), this is like running `yarn` or `npm install` in an Expo project. `expo run:ios` does this automatically when the **package.json** changes.

### Android configuration

<TerminalBlock cmd={['# Build your native Android project', 'expo run:android']} />

Once the app is built, press the "Open a web browser" button and watch the browser open. Success! Happy times.

## What now?

Most of the Expo SDKs APIs are available in bare React Native projects and can be installed using a process very similar to the above. You can see which are supported and which aren't in the [Supported Expo SDK Packages](unimodules-full-list.md) section, or just go ahead and browse the `API Reference` section and follow the installation instructions linked there, read the API documentation, and enjoy. Good luck building your app!
