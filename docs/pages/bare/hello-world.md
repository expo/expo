---
title: Up and Running
sidebar_label: Up and Running
---

> This guide assumes that you have Xcode and/or Android Studio installed and working. It also assumes that you want to create a new project. If you have an existing app that you would like to integrate the Expo SDK in an existing app, read the [existing apps guide](../bare/existing-apps.md).

Before you get started with a bare React Native project, make sure you set up your environment for [React Native CLI](https://reactnative.dev/docs/environment-setup).

After this, let's get started with a bare project. Run `expo init` and choose one of the bare templates. We'll use the minimum template here.

```sh
# If you don't have expo-cli yet, get it
npm i -g expo-cli
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

```sh
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

Bare projects are initialized using [CocoaPods](https://cocoapods.org/), a dependency manager for iOS projects.

- Run `npx pod-install` to link the native iOS packages using CocoaPods.
- Run `npx react-native run-ios` to rebuild your project with the native code linked.

### Android configuration

You don't have to do anything, just run the project with `npx react-native run-android`. Once the app is built, press the "Open a web browser" button and watch the browser open. Success! Happy times.

## What now?

Most of the Expo SDKs APIs are available in bare React Native projects and can be installed using a process very similar to the above. You can see which are supported and which aren't in the [Supported Expo SDK Packages](unimodules-full-list.md) section, or just go ahead and browse the `API Reference` section and follow the installation instructions linked there, read the API documentation, and enjoy. Good luck building your app!
