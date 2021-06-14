---
title: Installation in React Native and Bare workflow projects
sidebar_title: Manual Installation
---

import InstallSection from '~/components/plugins/InstallSection';
import ConfigurationDiff from '~/components/plugins/ConfigurationDiff';

The installation steps on this page are only required to add a development client to an **existing** React Native or Bare project.

To initialize a new Bare project or to add a development client to an existing managed project, see our [Getting Started guide](/getting-started.md).

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
To do that, you need to open Xcode, go to `Project settings` > `General` > `Deployment info` and select iOS version is at least 11.

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

### Disable packager autostart when building for iOS

When you start your project on iOS, the metro bundler will be started automatically. This behavior might not be ideal when you want to use `expo start`. Our recommended solution is to remove the `Start Packager` action from building scripts. To do that you need to open the Xcode, go to `Project settings` > `Build Phases` and remove the `Start Packager` action.

### Add better error handlers

Sometimes, for certain types of errors, we can provide more helpful error messages than the ones that ship by default with React Native. To turn this feature on, you need to add following lines to your `index.js`:

```js
import { registerErrorHandlers } from 'expo-dev-client';
registerErrorHandlers();
```

<img src="/static/images/client/remove_start_packager.png" style={{maxWidth: "100%" }}/>
