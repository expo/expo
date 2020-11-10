---
title: Installation
---

import TerminalBlock from '~/components/plugins/TerminalBlock';

There are two tools that you need to develop apps with Expo: a command line app called Expo CLI to initialize and serve your project and a mobile client app called Expo client to open it on iOS and Android. Any web browser will work for opening the project on the web.

> 💡 You don't need macOS to build an iOS app with Expo, you only need an iOS device to run the Expo client app. For your development machine, Windows, Linux, and macOS are all supported.

## 1. Expo CLI

Expo CLI is a command line app that is the main interface between a developer and Expo tools. Expo CLI also has a web-based GUI that pops up in your web browser when you start your project &mdash; you can use the GUI instead of the command line interface if you're not yet comfortable using a terminal or prefer GUIs, both have similar capabilities.

### Requirements

- [Node.js LTS release](https://nodejs.org/en/) or greater
- [Git](https://git-scm.com)
- [Watchman](https://facebook.github.io/watchman/docs/install#buildinstall) for macOS users

### Installing Expo CLI

<TerminalBlock cmd={['# Install the command line tools', 'npm install --global expo-cli']} />

Verify that the installation was successful by running `expo whoami`. You're not logged in yet, so you will see "Not logged in". You can create an account by running `expo register` if you like, or if you have one already run `expo login`, but you also don't need an account to get started.

> 😳 **Need help?** Try searching the [forums](https://forums.expo.io) &mdash; which are a great resource for troubleshooting.

## 2. Expo client app for iOS and Android

The fastest way to get up and running is to use the Expo client app on your iOS or Android device. Expo client allows you to open up apps that are being served through Expo CLI.

- 🤖 [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) - Android Lollipop (5) and greater.
- 🍎 [iOS App Store](https://itunes.com/apps/exponent) - iOS 10 and greater.

When the Expo client is finished installing, open it up. If you created an account with `expo-cli` then you can sign in here on the "Profile" tab. This will make it easier for you to open projects in the client when you have them open in development &mdash; they will appear automatically in the "Projects" tab of the client app.

> 👉 It's often useful to be able to run your app directly on your computer instead of on a separate physical device. If you would like to set this up, you can learn more about [installing the iOS Simulator (macOS only)](../workflow/ios-simulator.md) and [installing an Android emulator](../workflow/android-studio-emulator.md).

## Up next

Now that `expo-cli` and the Expo client are installed, [let's create a new app and write some code](../get-started/create-a-new-app.md).
