---
title: Existing Apps
sidebar_title: Existing Apps
---

If you want to use parts of the Expo SDK in your existing React Native app, you are in the right place.

**Most packages in the Expo SDK depend on a React Native module dependency injection and utility library called [react-native-unimodules](https://github.com/expo/expo/tree/master/packages/react-native-unimodules). Once it is installed and configured in your app, you can install other packages from the Expo SDK just as you would any other React Native library.**

The reason react-native-unimodules exists is so that we can reuse native code across Expo modules to reduce code duplication, improve reliability, and provide a consistent API across modules. For example, `Camera` can use native code from `FileSystem` and `Permissions` rather than `Camera` reimplementing the functionality those modules provide.

## Setting up react-native-unimodules

Follow the the [installing react-native-unimodules guide](../bare/installing-unimodules.md). It should take about five minutes to configure in an existing app.

## Install libraries from the Expo SDK

The short version: find an Expo package that you would like to use in the API reference or by searching this documentation, eg: [expo-web-browser](../versions/latest/sdk/webbrowser.md),install it with npm, then run `npx pod-install` and re-build your app.

The longer, more detailed version: check out [Install an Expo SDK package](hello-world.md#install-an-expo-sdk-package) in the "Up and Running" guide.

## That's it!

You're ready to go. You may also want to install expo-updates in your app to add support for over-the-air-updates. If so, follow the [installing expo-updates guide](../bare/installing-updates.md) guide once you have installed react-native-unimodules.
