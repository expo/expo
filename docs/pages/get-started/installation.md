---
title: Installation
---

There are two tools that you need to develop apps with Expo: a local development tool and a mobile client to open your app.

## 1. Local development tool: Expo CLI

Expo CLI is a tool for developing apps with Expo. In addition the command-line interface (CLI) it also has a web-based graphical user interface (GUI) that pops up in your web browser when you start your project &mdash; you can use this if you're not yet comfortable with the using terminal or just prefer GUIs, both have similar capabilities.

### Pre-requisities

- **Node.js**: In order to install Expo CLI you will need to have Node.js (**we recommend the latest stable version**- but the maintenance and active LTS releases will also work) installed on your computer. [Download the recommended version of Node.js](https://nodejs.org/en/).
- **Git**: Additionally, you'll need Git to create new projects. [You can download Git from here](https://git-scm.com).

### Installing Expo CLI

We recommend installing Expo CLI globally, you can do this by running the following command:

```
npm install -g expo-cli
```

Verify that the installation was successful by running `expo whoami`. You're not logged in yet, so you will see "Not logged in". You can create an account by running `expo register` if you like, or if you have one already run `expo login`, but you also don't need an account to get started.

> 😳 **Running into problems?** Try searching for your error message on the [forums](https://forums.expo.io) &mdash; you're probably not the first person to encounter your issue, and the forums are a great resource for these types of problems.

### Optional: Installing Watchman

Some macOS users encounter issues if they do not have Watchman installed on their machine, so if you are using a Mac we recommend that you install it. [Download and install Watchman](https://facebook.github.io/watchman/docs/install#buildinstall).

> 💡Watchman watches files and records when they change, then triggers actions in response to this, and it's used internally by React Native. 

## 2. Mobile app: Expo client for iOS and Android

Expo client is the tool you will use to run your projects while you're developing them. When you serve your project with Expo CLI, it generates a development URL that you can open in Expo client to preview your app.

- 🤖 [Download Expo client for Android from the Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- 🍎 [Download Expo client for iOS from the App Store](https://itunes.com/apps/exponent)

> ⚠️ **Required operating system versions:** The minimum Android version is Lollipop (5) and the minimum iOS version is iOS 10.0.

When the Expo client is finished installing, open it up. If you created an account with `expo-cli` then you can sign in here on the "Profile" tab. This will make it easier for you to open projects in the client when you have them open in development &mdash; they will appear automatically in the "Projects" tab of the client app.

### Running the Expo client on your computer

The quickest way to get started is to run the Expo client on your physical iOS or Android device. If at some point you want to install a simulator or emulator to run the app directly on your computer you can find the [iOS simulator instructions here](../../workflow/ios-simulator/) and the [Android emulator instructions here](../../workflow/android-studio-emulator/). The iOS simulator only runs on macOS, Android emulators run on any major operating system.

> 🧐 Apple uses the word "simulator" for their iOS emulator and Google uses the word "emulator". This is one of your first glimpses at how each native platform expresses the same concept in its own unique way, even if the result is the same. Expo does our best to handle these differences for you and present you with a clean cross-platform API. Unfortunately we can't rename "simulator" to "emulator" or we would.

## Up next

Now that you have installed `expo-cli` and Expo client, [let's create a new app and write some code](../../get-started/create-a-new-app/).
