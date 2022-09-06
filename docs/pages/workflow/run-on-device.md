---
title: Running on device
---

import { Collapsible } from '~/ui/components/Collapsible';
import { Terminal } from '~/ui/components/Snippet';

> This guide focuses on running a project on your own device. To learn about sharing your project with others, refer to ["Sharing pre-release versions of your app"](/guides/sharing-preview-releases/) and ["Distribution"](/distribution/introduction/).

You will approach running your project on your device differently depending on how you are using Expo tools. There are three main approaches: you can use Expo Go, a development build, or you can run your project as a standalone app.

## Running a project in Expo Go

Download Expo Go [from the Apple App Store](https://itunes.apple.com/app/apple-store/id982107779) or [from the Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent&referrer=www).

- On your iPhone or iPad, open the default Apple "Camera" app and scan the QR code you see in the terminal.
- On your Android device, press "Scan QR Code" on the "Home" tab of the Expo Go app and scan the QR code you see in the terminal.

You can open the project on multiple devices simultaneously. Go ahead and try it on an iPhone and Android phone at the same time if you have both handy.

<Collapsible summary="Is the app not loading on your device?">

First, make sure you are on the same Wi-Fi network on your computer and your device.

If it still doesn't work, it may be due to the router configuration &mdash; this is common for public networks. You can work around this by choosing the "Tunnel" connection type when starting the development server, then scanning the QR code again.

<Terminal cmd={['$ npx expo start --tunnel']} cmdCopy="npx expo start --tunnel" />

> Using the "Tunnel" connection type will make app reloads considerably slower than on "LAN" or "Local", so it's best to avoid tunnel when possible. You may want to install a simulator/emulator to speed up development if "Tunnel" is required for accessing your machine from another device on your network.

</Collapsible>

## Running a project with a development build

When you have hit the limitations of Expo Go and need to move on to development builds (for example, to [add custom native code](/workflow/customizing/)), the process for loading the project remains mostly the same but the mechanism to get the build on your device is different. Development builds can be created locally with [`npx expo run:[ios|android] --device`](/workflow/expo-cli/), with Xcode or Android Studio, or [remotely with EAS Build](/build/introduction/).

Refer to the ["Getting Started" guide for development builds](/development/getting-started/) to learn how to create a development build and run it on your device.

## Running a project as a standalone app

Both Expo Go and development builds include a user interface that is convenient for development, but that you would not use in a production release of your app. You can create standalone builds in the same way as development builds — locally with [`npx expo run:[ios|android] --device`](/workflow/expo-cli/), with Xcode or Android Studio, or [remotely with EAS Build](/build/introduction/). If you have `expo-dev-client` installed in your project, you will need to build the "Release" configuration/variant (`--configuration Release` for iOS and `--variant release` for Android).

You may choose to install directly to your device (the `--device` flag with `npx expo run:[ios|android]`, or by selecting it in an IDE) or to use [internal distribution](/build/internal-distribution/), or [TestFlight](/submit/ios) / [Google Play](/submit/android).
