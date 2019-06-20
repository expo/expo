---
title: iOS Simulator
---

It's often convenient to develop your app directly on your computer rather than having to physically interact with an iPhone and iPad and load your app over the network, which may be slow under some conditions such as if you need to use a tunnel connection because LAN isn't possible on your network.

This guide explains how you can install the iOS simulator on your Mac and use it for developing your app. It is not possible to install the iOS Simulator on any operating system except macOS; if you want to develop an app for iOS from a Windows machine then you will need to use a physical iOS device.

## Step 1: Install Xcode

This step is very easy but it takes a while. Open up the Mac App Store, search for Xcode, and hit install (or update if you have it already). If you're not able to update because your operating system is out of date, we recommend updating your operating system to the latest version and then updating Xcode. You may run into issues further down the line if your Xcode version is out of date, for example you may not be able to submit your app to the App Store.

## Step 2: Install Xcode Command Line Tools

Open Xcode, then choose "Preferences..." from the Xcode menu (or press ⌘+,). Go to the Locations panel and install the tools by selecting the most recent version in the Command Line Tools dropdown.

![Xcode Preferences](/static/images/xcode-command-line.png)

## Step 3: Try it out

Run your app with `expo-cli` and press `i` from the command line or `Run on iOS simulator` from the browser-based DevTools UI. You may get a warning about needing to accept the Xcode license. Run the command that it suggests. Open your app again, success! Or no? If no, please seek help on StackOverflow, Google, or the [Expo-CLI section of the forums](https://forums.expo.io/c/expo-cli). The troubleshooting tips below may be helpful too.

## Troubleshooting

### The CLI seems to be stuck on "Trying to open the project in iOS simulator..."

Sometimes the iOS simulator doesn't respond to commands to open. If it seems to be stuck on this prompt, you can open the iOS simulator manually (`open -a Simulator`) and then in the macOS toolbar choose Hardware &rarr; Device and select an iOS version and device that you'd like to open.

![Xcode Preferences](/static/images/open-simulator-manually.png)

You can also use this menu to open any version of the simulator that you like. You can open multiple simulators at the same time but `expo-cli` will always act on the most recently opened on.

### The simulator opened but the Expo client app isn't opening inside of it

The first time you install the app in the simulator, iOS will prompt you to ask if you'd like to open the Expo client app. You may need to interact with the simulator (click around, drag something) for this prompt to show up. Press OK when it shows up.

### How do I force an update to the latest version?

You can run `expo install:ios` to download and install the latest Expo client version in the simulator.

### expo-cli is printing some esoteric error message about xcrun, what do I do?

Run `expo client:install:ios` again to uninstall and reinstall the Expo client app. If that doesn't help, focus the simulator window and in the Mac toolbar choose Hardware &rarr; Erase All Content and Settings... This will reinitialize your simulator from a blank image. Good to go!