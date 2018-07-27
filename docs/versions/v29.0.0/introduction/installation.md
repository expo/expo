---
title: Installation
---

There are two tools that you need to develop apps with Expo: a local development tool and a mobile client to open your app.

## Local Development Tool: XDE (or exp)

### Desktop Tool: XDE

XDE stands for Expo Development Environment. It is a standalone desktop app that includes all dependencies you'll need to get started.

Download the latest version of XDE for [macOS](https://xde-updates.exponentjs.com/download/mac), [Windows (64-bit)](https://xde-updates.exponentjs.com/download/win32), or [Linux](https://xde-updates.exponentjs.com/download/linux-x86_64).

On Linux, open with `chmod a+x xde*.AppImage` and `./xde*.AppImage`.

### Optional Command Line Tool: exp

`exp` is an alternative to XDE for users who prefer to use the command line. You can choose whichever one you want. Some advanced Expo features may require you to use `exp` later.

You can install `exp` by running `npm i -g exp`.

## Mobile Client: Expo for iOS and Android

Expo Client helps view your projects while you're developing them. When you serve your project from XDE or `exp`, it generates a development URL that you can open in Expo Client to preview your app. On Android, Expo Client can also be used to view others' projects on [expo.io](https://expo.io). Expo Client works on devices, simulators, and emulators.

### On your device

[Download for Android from the Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) or [for iOS from the App Store](https://itunes.com/apps/exponent)

> **Required Android and iOS versions:** The minimum Android version Expo supports is Android 4.4 and the minimum iOS version is iOS 9.0.

You don't need to manually install the Expo client on your emulator/simulator, because XDE will do that automatically. See the next sections of this guide.

### iOS simulator

Install [Xcode through the Apple App Store](https://itunes.apple.com/app/xcode/id497799835). It'll take a while, go have a nap. Next, open up Xcode, go to preferences and click the Components tab, install a simulator from the list.

Once the simulator is open and you have a project open in XDE, you can press _Open on iOS simulator_ in XDE and it will install the Expo Client to the simulator and open up your app inside of it.

> **Not working?** Occasionally XDE will have trouble installing the Expo Client automatically, usually due to annoying small differences in your environment or Xcode toolchain. If you need to install the Expo Client on your simulator manually, you can follow these steps:
> 
> - Download the [latest simulator build](http://expo.io/--/api/v2/versions/download-ios-simulator-build).
> - Extract the contents of the archive. You should get a directory like `Exponent-X.XX.X`.
> - Make sure Simulator is running.
> - At a terminal, run `xcrun simctl install booted [path to extracted directory]`.

### Android emulator

Follow our [Android Studio emulator guide](../workflow/android-studio-emulator.html) to set up Android tools and create a virtual device. Start up the virtual device when it's ready.

Once the emulator is open and you have a project open in XDE, you can press _Open project in Expo on Android_ in XDE and it will install the Expo client to the emulator and open up your app inside of it.

## Node.js

To get started with Expo you don't necessarily need to have Node.js installed, but as soon as you start actually building something you'll want to have it. [Download the latest version of Node.js](https://nodejs.org/en/).

## Watchman

Some macOS users encounter issues if they do not have this installed on their machine, so we recommend that you install Watchman. Watchman watches files and records when they change, then triggers actions in response to this, and it's used internally by React Native. [Download and install Watchman](https://facebook.github.io/watchman/docs/install.html).
