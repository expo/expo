---
title: Installation
---

import TerminalBlock from '~/components/plugins/TerminalBlock';

Developing Expo apps locally requires a CLI, and a client app or web browser to run the project. You can also get started in the browser with [Snack](https://snack.expo.io/).

## 1. Expo CLI

Expo CLI is a tool for developing apps and websites with React. Expo CLI also has a web-based GUI that pops up in your web browser when you start your project &mdash; this can be used in favor of the CLI if you're not yet comfortable using a terminal or just prefer GUIs, both have similar capabilities.

### Requirements

- [Node.js 12](https://nodejs.org/en/) or greater
- [Git](https://git-scm.com) for version control
- [Watchman](https://facebook.github.io/watchman/docs/install#buildinstall) for MacOS users

### Installing Expo CLI

The best way to get started with universal React is by using `expo-cli`, alternatively you can use [`create-react-native-app`](https://github.com/expo/create-react-native-app) for more templates.

<TerminalBlock cmd={['# Install the command line tools', 'npm install --global expo-cli','', '# Create a new project', 'expo init my-project', 'cd my-project']} />

> 😳 **Need help?** Try searching the [forums](https://forums.expo.io) &mdash; which are a great resource for troubleshooting.

<TerminalBlock cmd={['# Start the development server', 'expo start']} />

- Pressing `i` will open in the [iOS Simulator](../../workflow/ios-simulator/).
- Pressing `a` will open in the [Android Emulator](../../workflow/android-studio-emulator/).
- Pressing `w` will open in your Browser. Expo supports all major browsers.

## 2. Mobile app: Expo client for iOS and Android

The fastest way to get up and running is to use the Expo client app on your iOS or Android device. Expo client allows you to open up apps that are being served through Expo CLI.

- 🤖 [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) - Android Lollipop (5) and greater.
- 🍎 [iOS App Store](https://itunes.com/apps/exponent) - iOS 10 and greater.

When the Expo client is finished installing, open it up. If you created an account with `expo-cli` then you can sign in here on the "Profile" tab. This will make it easier for you to open projects in the client when you have them open in development &mdash; they will appear automatically in the "Projects" tab of the client app.

### Running the Expo client on your computer

Projects can also be run on a computer with the [iOS Simulator (MacOS only)](../../workflow/ios-simulator/) or [Android emulator (Any OS)](../../workflow/android-studio-emulator/).

<TerminalBlock cmd={['# Start and open the project on all devices', 'expo start --ios --android --web']} />

> 🧐 Apple uses the word "simulator" for their iOS emulator and Google uses the word "emulator", these perform the same function conceptually and are different in name alone.

## Up next

Now that `expo-cli`, and the Expo client are installed, [let's create a new app and write some code](../../get-started/create-a-new-app/).
