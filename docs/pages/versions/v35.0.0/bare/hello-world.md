---
title: Up and Running
sidebar_label: Up and Running
---

To get started with a bare React Native project, run `expo init` and choose one of the bare templates. We'll use the minimum template here. This guide assumes that you have Xcode and/or Android Studio installed and working.

```bash
# If you don't have expo-cli yet, get it
npm i -g expo-cli
# If you don't have react-native-cli yet, get it
npm i -g react-native-cli
# This is a shortcut to skip the UI for picking the template
expo init --template bare-minimum
```

Next, let's get the project running. Go into your project directory and run `react-native run-ios` or `react-native run-android` &mdash; hurray! Your project is working.

## Using react-native-unimodules

Bare template projects come with `react-native-unimodules` installed and configured. This package gives you access to some commonly useful APIs, like `Asset`, `Constants`, `FileSystem`, and `Permissions`. You can import these from `react-native-unimodules` like so:

```js
import { Asset, Constants, FileSystem, Permissions } from 'react-native-unimodules';
```

## Install an Expo SDK package

We're going to install [`expo-web-browser`](https://github.com/expo/expo/tree/master/packages/expo-web-browser), it's a useful little package for showing a modal web browser using the appropriate native APIs on each platform.

```bash
npm install expo-web-browser
```

Open up `App.js` and add a button that, when pressed, opens up a web browser. Here's some code for you.

```js
import * as React from 'react';
import { Button, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

export default class App extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Button
          title="Open a web browser"
          onPress={() => {
            WebBrowser.openBrowserAsync('https://expo.io');
          }}
        />
      </View>
    );
  }
}
```

This will not yet work because we haven't linked the native code that powers it. To do this, we need to follow the instructions in the [`expo-web-browser` README](https://github.com/expo/expo/tree/master/packages/expo-web-browser) to configure it for iOS and Android. Let's do it.

### iOS configuration

The iOS side is easiest, so let's do it first. Bare projects are initialized using [Cocoapods](https://cocoapods.org/), a dependency manager for iOS projects. If you don't have Cocoapods installed already, [install it](https://guides.cocoapods.org/using/getting-started.html). Now let's run `pod install` in the `ios` directory. Now you can run `react-native run-ios` again from the root of the project and it should work as expected!

### Android configuration

You don't have to do anything, just run the project with `react-native run-android`. Once the app is built, press the "Open a web browser" button and watch the browser open. Success! Happy times.

## What now?

Most of the Expo SDKs APIs are available in bare React Native projects and can be installed using a process very similar to the above. You can see which are supported and which aren't in the [Supported Expo SDK Packages](../unimodules-full-list/) section, or just go ahead and browse the `API Reference` section and follow the installation instructions linked there, read the API documentation, and enjoy. Good luck building your app!
