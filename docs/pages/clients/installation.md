---
title: Installation
---

import InstallSection from '~/components/plugins/InstallSection';
import ConfigurationDiff from '~/components/plugins/ConfigurationDiff';

**Expo Development Client** is an open source project to improve your development experience while working on your Expo and React Native projects. It allows your team to focus on the JavaScript portion of your project, only needing to interact with Xcode or Android Studio when you need to make changes to the native code used in your project.

> ⚠️ **Managed Expo projects are not yet supported**, but we are working on bringing the Development Client to the Managed Workflow! If you want to build a managed Expo project with the Development Client, you'll have to eject it first. See the [Ejecting to Bare Workflow](../workflow/customizing.md) page to learn how.

## Create a new project with the Development Client

The easiest way to get started is to initialize a new project by executing the following command:

<InstallSection packageName="expo-development-client" cmd={["npx crna -t with-dev-client"]} hideBareInstructions />

## Add the Development Client to the existing project

## 1. Installation

Add the Expo Development Client packages to your package.json.

<InstallSection packageName="expo-development-client" cmd={["npm install expo-dev-client"]} hideBareInstructions />

<!-- note: `/client/submodules` doesn't exists, commenting this out for now -->
<!-- [Want to learn more about how these modules work?](/client/submodules/) -->

### 🍏 iOS

Change your `Podfile` to make sure that the Development Client will be removed in the release builds:

<ConfigurationDiff source="/static/diffs/client/podfile.diff" />

Add configuration in `react-native.config.js` to allow React Native autolinking to find the dependencies of `expo-dev-client`:

<ConfigurationDiff source="/static/diffs/client/react-native.config.js.diff" />

Then you can run the following command to install native code for the Dev Launcher via CocoaPods.

<InstallSection packageName="expo-development-client" cmd={["npx pod-install"]} hideBareInstructions />

Also, make sure that your project is configured to deploy on iOS **above 10**.
To do that you need open the Xcode, go to `Project settings` > `General` > `Deployment info` and select iOS version is at least 11.

<img src="/static/images/client/check_ios_version.png" style={{maxWidth: "100%" }}/>

## 2. Basic configuration

The Development Client uses deep links to open projects from the QR code. If you had added a custom deep link schema to your project, the Development Client will use it. However, if this isn't the case, you need to configure the deep link support for your application. We know that this process might be difficult. So, we provided a simple command which will do all the work for you:

<InstallSection packageName="expo-development-client" cmd={["npx uri-scheme add <your scheme>"]} hideBareInstructions />

See the [uri-scheme package](https://www.npmjs.com/package/uri-scheme) for more information.

### 🍏 iOS

Make the following changes to allow the Development Client to control project initialization in the **DEBUG** mode.

<ConfigurationDiff source="/static/diffs/client/app-delegate.diff" />

### 🤖 Android

Make the following changes to allow the Development Client to control project initialization in the **DEBUG** mode.

> **Note:** If you have a custom activity in your application already, or just want to understand what the `DevMenuAwareReactActivity` is doing, you can see [advanced instructions for Android here.](https://github.com/expo/expo/tree/master/packages/expo-dev-menu#-android)

<ConfigurationDiff source="/static/diffs/client/main-activity-and-application.diff" />

## 3. Build and Install

You're now ready to start developing your project with the Development Client.

## 4. Optional configuration

### 🍏 iOS

When you start your project on iOS, the metro bundler will be started automatically. This behavior might not be ideal when you want to use `expo start`. Our recommended solution is to remove the `Start Packager` action from building scripts. To do that you need to open the Xcode, go to `Project settings` > `Build Phases` and remove the `Start Packager` action.

<img src="/static/images/client/remove_start_packager.png" style={{maxWidth: "100%" }}/>

### Loading published updates

The Development Client can also be used to open and preview published updates to your app. To add this feature, you need to add `expo-updates` to your app if it isn't already installed, and add a small additional integration in your `AppDelegate.m` and `MainApplication.java` files.

1. [Install and set up `react-native-unimodules` in your project](../bare/installing-unimodules.md), if you have not already done so.
2. [Install and set up `expo-updates` in your project](../bare/installing-updates.md), if you have not already done so.
3. Make the following changes to complete the integration with `expo-updates`:

<ConfigurationDiff source="/static/diffs/client/app-delegate-updates.diff" />

<ConfigurationDiff source="/static/diffs/client/main-application-updates.diff" />
