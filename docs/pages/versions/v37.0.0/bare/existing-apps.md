---
title: Existing Apps
sidebar_title: Existing Apps
---

If you want to use parts of the Expo SDK in your existing React Native app, you are in the right place.

Most packages in the Expo SDK depend on a React Native module dependency injection and utility library called [react-native-unimodules](https://github.com/unimodules/react-native-unimodules). Once it is installed and configured in your app, you can install other packages from the Expo SDK just as you would any other React Native library.

> 💡 react-native-unimodules has a minimal overhead on your app size, and it's configurable so you can have full control over what pieces you want to use. Most developers will leave the default configuration, but check out the "Advanced Configuration" sections if you are curious.

## Setting up react-native-unimodules

The most up-to-date installation and configuration instructions are kept [in the README on GitHub](https://github.com/unimodules/react-native-unimodules/blob/master/README.md) Follow those instructions and it should take a few minutes to set up. If you'd prefer, you can use expo-cli to initialize a new app preconfigured with react-native-unimodules and expo-updates for you. [Read about that in "Up and Running"](../hello-world/).

## Installing libraries from the Expo SDK

The short version: find an Expo package that you would liek to use in the API reference or by searching this documentation, eg: [expo-web-browser](../../sdk/webbrowser/),install it with npm, then run `pod install` in the `ios` directory and re-run your app.

The longer, more detailed version: check out [Install an Expo SDK package](../hello-world/#install-an-expo-sdk-package) in the "Up and Running" guide.

## That's it!

You're ready to go. Might I suggest checking out [expo-updates](../../sdk/updates/)?