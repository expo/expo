---
title: Testing on physical devices
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

The best way to interactively test and verify the behavior and feel of your app as you change code is by loading it in the Expo Client App, as described in other guides.

There are several ways to get the client app into a test environment.

## Install Expo Client App from a device's App Store

This is the simplest and easiest way, and the one we recommend for all developers.

## Build Expo Client App on your computer and side-load it onto a device

[The client apps are open-source](https://github.com/expo/expo), and their readme contains instructions on how to compile them locally and install them onto devices attached to your computer by a USB cable.

## Run Expo Client App on your computer in a device Emulator/Simulator

[The client apps github repository](https://github.com/expo/expo) also includes instruction on how to build and run the iOS Client App in the Xcode Device Simulator, and the Android Client App in the Android Studio Device Emulator.
