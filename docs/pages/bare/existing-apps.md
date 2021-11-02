---
title: Existing Apps
sidebar_title: Existing Apps
---

If you want to use parts of the Expo SDK in your existing React Native app, you are in the right place.

**Most packages in the Expo SDK depend on a module tooling installed with the [expo](https://github.com/expo/expo/tree/master/packages/expo) package. Once it is installed and configured in your app, you can install other packages from the Expo SDK just as you would any other React Native library.**

## Setting up the `expo` packag

Follow the the [installing Expo modules guide](../bare/installing-expo-modules.md). It should take about five minutes to configure in an existing app.

## Install libraries from the Expo SDK

The short version: find an Expo package that you would like to use in the API reference or by searching this documentation, eg: [expo-web-browser](../versions/latest/sdk/webbrowser.md),install it with npm, then run `npx pod-install` and re-build your app.

The longer, more detailed version: check out [Install an Expo SDK package](hello-world.md#install-an-expo-sdk-package) in the "Up and Running" guide.

## That's it!

You're ready to go. You may also want to install `expo-updates` in your project to add support for updates. If so, follow the [installing `expo-updates` guide](../bare/installing-updates.md) guide once you have installed `expo`.
