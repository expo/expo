---
title: Installation
---

import { Terminal } from '~/ui/components/Snippet';

To develop applications with Expo, you need two tools. A command-line application called [Expo CLI](#1-expo-cli) to serve your project, and a mobile client app called [Expo Go](#2-expo-go-app-for-ios-and) to open the project on iOS and Android platforms. Additionally, you can use any web browser to run the project on the web.

> You don't need macOS to build an iOS app with Expo. You only need an iOS device to run the Expo Go app. Windows, Linux, and macOS are all supported for your development machine.

## 1. Expo CLI

[Expo CLI](/workflow/expo-cli) is a command-line app that is the primary interface between a developer and Expo tools. You are going to use it for different tasks in the development life cycle of your project such as serving the project in development, viewing logs, opening the app on an emulator or a physical device, etc.
### Requirements

To install and use Expo CLI, you need to have the following tools installed on your developer machine:

- [Node.js LTS release](https://nodejs.org/en/)
- [Git](https://git-scm.com)
- [Watchman](https://facebook.github.io/watchman/docs/install#buildinstall), required only for macOS or Linux users

> Only Node.js LTS releases (even-numbered) are recommended. As Node.js [officially states](https://nodejs.org/en/about/releases/), "Production applications should only use Active LTS or Maintenance LTS releases."

### Recommended tools

- [VS Code Editor](https://code.visualstudio.com/download)
  - [VS Code Expo Extension](https://marketplace.visualstudio.com/items?itemName=byCedric.vscode-expo) for **app.json** debugging and autocomplete
- [Yarn](https://classic.yarnpkg.com/en/docs/install)
- Windows users: [PowerShell](https://docs.microsoft.com/en-us/powershell/scripting/install/installing-powershell-core-on-windows), Bash via WSL, or the VS Code terminal

### Installing Expo CLI

To install Expo CLI, you need to install it as a global npm package. Open the terminal on your development machine and run the following command:

<Terminal cmd={[
  '# Install the command line tools',
  '$ npm install --global expo-cli'
]} />

To verify the successful installation of CLI, run the following command:

<Terminal cmd={['$ expo whoami']} />

If the installation is successful, you will see a "Not logged in" message since you are not logged in to an Expo account yet. You do not need an account to start and can proceed further with your project. However, if you want to register a new expo account, run the command:

<Terminal cmd={['$ expo register']} />

If you already have an Expo account, you can log in to it by running the command:

<Terminal cmd={['$ expo login']} />

> **Need help?** Try searching the [forums](https://forums.expo.dev) &mdash; which are great resources for troubleshooting.

## 2. Expo Go app for iOS and Android

The fastest way to get up and running is to use the [Expo Go](https://expo.dev/client) client app on your iOS or Android device. It allows you to open up apps served through Expo CLI and run your projects faster when developing them. It is available on both the iOS App Store and Android Play Store.

- [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) - Android Lollipop (5) and greater
- [iOS App Store](https://apps.apple.com/app/expo-go/id982107779) - iOS 11 and greater

Open the Expo Go app after it has finished installing. If you have created an account with `expo-cli`, you can sign in by clicking the "Login" button in the top header on the "Home" tab. Signing in will make it easier for you to open projects in the Expo Go app while developing them &mdash; they will appear automatically under the "Projects" section on the Home tab of the app.

> It's often useful to be able to run your app directly on your computer instead of on a separate physical device. If you would like to set this up, you can learn more about [installing the iOS Simulator (macOS only)](../workflow/ios-simulator.md) and [installing an Android Emulator](../workflow/android-studio-emulator.md).

## Up next

Now that `expo-cli` and the Expo Go app are installed, [let's create a new app and write some code](../get-started/create-a-new-app.md).
