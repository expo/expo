---
title: Installation
---

There are two tools that you need to develop apps with Expo - a desktop development tool and a mobile client to open your app.

## Desktop Development Tool: XDE

XDE stands for Expo Development Environment. It is a standalone desktop app that includes all dependencies you'll need to get started.

Download the latest version of XDE for [macOS](https://xde-updates.exponentjs.com/download/mac), [Windows (64-bit)](https://xde-updates.exponentjs.com/download/win32), or [Linux](https://xde-updates.exponentjs.com/download/linux-x86_64).

On Linux, open with `chmod a+x xde*.AppImage` and `./xde*.AppImage`.

## Mobile Client: Expo for iOS and Android

The Expo client is like a browser for apps built with Expo. When you boot up XDE on your project it generates a unique development URL for you, and you can access that from the Expo client on iOS or Android, either on a real device or in a simulator.

### On your device

[Download for Android from the Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) or [for iOS from the App Store](https://itunes.com/apps/exponent)

> **Required Android and iOS versions:** The minimum Android version Expo supports is Android 4.4 and the minimum iOS version is iOS 9.0.

You don't need to manually install the Expo client on your emulator/simulator, because XDE will do that automatically. See the next sections of this guide.

### iOS simulator

Install [Xcode through the Apple App Store](https://itunes.apple.com/app/xcode/id497799835). It'll take a while, go have a nap. Next, open up Xcode, go to preferences and click the Components tab, install a simulator from the list.

Once the simulator is open and you have a project open in XDE, you can press _Open on iOS simulator_ in XDE and it will install the Expo client to the emulator and open up your app inside of it.

### Android emulator

[Download Genymotion](https://www.genymotion.com/fun-zone/) (free version) and follow the [Genymotion installation guide](https://docs.genymotion.com/Content/01_Get_Started/Installation.htm). Once you've installed Genymotion, create a virtual device - we recommend a Nexus 5, the Android version is up to you. Start up the virtual device when it's ready.

Once the emulator is open and you have a project open in XDE, you can press _Open project in Expo on Android_ in XDE and it will install the Expo client to the emulator and open up your app inside of it. If you run into any issues follow our [Genymotion guide](../guides/genymotion.html#genymotion).

## Node.js

To get started with Expo you don't necessarily need to have Node.js installed, but as soon as you start actually building something you'll want to have it. [Download the latest version of Node.js](https://nodejs.org/en/).

## Watchman

Some macOS users encounter issues if they do not have this installed on their machine, so we recommend that you install Watchman. Watchman watches files and records when they change, then triggers actions in response to this, and it's used internally by React Native. [Download and install Watchman](https://facebook.github.io/watchman/docs/install.html).
