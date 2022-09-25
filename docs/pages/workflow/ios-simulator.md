---
title: iOS Simulator
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight'
import Video from '~/components/plugins/Video'
import { Terminal } from '~/ui/components/Snippet';

It's often convenient to develop your app directly on your computer rather than having to physically interact with an iPhone and iPad and load your app over the network, which may be slow under some conditions such as if you need to use a tunnel connection because LAN isn't possible on your network.

This guide explains how you can install the iOS simulator on your Mac and use it for developing your app. It is not possible to install the iOS Simulator on any operating system except macOS. If you want to develop an app for iOS from a Windows machine then you will need to use a physical iOS device.

## Step 1: Install Xcode

Open up the Mac App Store, search for [Xcode](https://apps.apple.com/us/app/xcode/id497799835), and hit install (or update if you have it already).
If you're unable to update, it is because your operating system might be out of date. We recommend updating your operating system to the latest version and then updating Xcode. 
You may run into issues further down the line if your Xcode version is out of date. For example, you may not be able to submit your app to the App Store.

## Step 2: Install Xcode Command Line Tools

Open Xcode, then choose **Preferences...** from the Xcode menu (or press <kbd>Cmd ⌘</kbd> + <kbd>,</kbd>). Go to the Locations panel and install the tools by selecting the most recent version in the Command Line Tools dropdown.

<ImageSpotlight alt="Xcode preferences" src="/static/images/xcode-command-line.png" />

## Step 3: Try it out

Run your app with `npx expo start` and press <kbd>I</kbd> from the command line. 

You may get a warning about needing to accept the Xcode license. Run the command that it suggests. Open your app again to see if it was successful.
If not, check the [troubleshooting](#troubleshooting) tips below.

If the troubleshooting tips are not helpful, seek help on [Expo Development Tools section of the forums](https://forums.expo.dev/c/expo-dev-tools), StackOverflow, or Google. 

<Video file="open-in-ios-simulator.mp4" />

> Pro Tip: Press <kbd>Shift</kbd> + <kbd>I</kbd> in the CLI UI to interactively select a simulator to open.

## Limitations

Although the iOS simulator is great for rapid development, it does come with a few limitations. [Apple's documentation](https://help.apple.com/simulator/mac/current/#/devb0244142d) goes into more detail, but we'll list out a few of the main differences that affect Expo APIs here.

The following hardware is unavailable in Simulator:

- Audio Input
- Barometer
- Camera
- Motion Support (accelerometer and gyroscope)

It should also be noted that Simulator suspends background apps and processes on iOS 11 and later.

## Troubleshooting

### The CLI seems to be stuck when opening a Simulator

Sometimes the iOS simulator doesn't respond to the open command. If it seems stuck on this prompt, you can open the iOS simulator manually (`open -a Simulator`) and then in the macOS toolbar, choose **Hardware** &rarr; **Device**, and select an iOS version and device that you'd like to open.

<ImageSpotlight alt="Hardware > Device toolbar in Xcode" src="/static/images/open-simulator-manually.png" />

You can also use this menu to open any version of the simulator that you like. You can open multiple simulators at the same time but Expo CLI will always target the most recently opened simulator.

### The simulator opened but the Expo Go app isn't opening inside of it

The first time you install the app in the simulator, iOS will ask if you'd like to open the Expo Go app. You may need to interact with the simulator (click around, drag something) for this prompt to show up, then press `OK`.

### How do I force an update to the latest version?

Create a project with the desired SDK version and open it in a simulator to install a particular version of Expo Go.

<Terminal cmd={[
'# Bootstrap an SDK 46 project',
'$ npx create-expo-app --template blank@46',
'',
'# Open the app on a simulator to install the required Expo Go app',
'$ npx expo start --ios'
]} />

### Expo CLI is printing an error message about xcrun, what do I do?

For miscellaneous errors, try the following:

- Manually uninstall Expo Go on your simulator and reinstall by pressing <kbd>Shift</kbd> + <kbd>I</kbd> in the Expo CLI Terminal UI and selecting the desired simulator.
- If that doesn't help, focus the simulator window and in the Mac toolbar choose **Hardware** &rarr; **Erase All Content and Settings...**<br/>
  This will reinitialize your simulator from a blank image. This is sometimes useful for cases where your computer is low on memory and the simulator fails to store some internal file, leaving the device in a corrupt state.
