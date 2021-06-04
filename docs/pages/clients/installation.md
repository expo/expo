---
title: Installation in React Native and Bare workflow projects
sidebar_title: Manual Installation
---

import InstallSection from '~/components/plugins/InstallSection';
import ConfigurationDiff from '~/components/plugins/ConfigurationDiff';

The installation steps on this page are only required to add expo-dev-client to an **existing** React Native or Bare project.

To initialize a new Bare project or to add a development client to an existing managed project, see our [Getting Started guide](/getting-started.md).

## Add expo-dev-client to an existing project

## 1. Installation

Add the `expo-dev-client` package to your package.json.

<InstallSection packageName="expo-development-client" cmd={["npm install expo-dev-client"]} hideBareInstructions />

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

To load your application's JavaScript in your client by scanning a QR code, you need to configure a deep link scheme for your application. The easiest way to do this is if you haven't already is with the `uri-scheme` package:

<InstallSection packageName="expo-development-client" cmd={["npx uri-scheme add <your scheme>"]} hideBareInstructions />

See the [uri-scheme package](https://www.npmjs.com/package/uri-scheme) for more information.

### 🍏 iOS

Make the following changes to allow the Development Client to control project initialization in the **DEBUG** mode.

<ConfigurationDiff source="/static/diffs/client/app-delegate.diff" />

### 🤖 Android

Make the following changes to allow the Development Client to control project initialization in the **DEBUG** mode.

> **Note:** If you have a custom activity in your application already, or just want to understand what the `DevMenuAwareReactActivity` is doing, you can see [advanced instructions for Android here.](https://github.com/expo/expo/tree/master/packages/expo-dev-menu#-android)

<ConfigurationDiff source="/static/diffs/client/main-activity-and-application.diff" />

## 3. Optional configuration

There are a few more changes you can make to get the best experience, but you [can skip ahead to building](/clients/getting-started/#building-and-installing-your-first-custom-client) if you prefer.

### Disable packager autostart when building for iOS

When you start your project on iOS, the metro bundler will be started automatically. This behavior might not be ideal when you want to use `expo start`. Our recommended solution is to remove the `Start Packager` action from building scripts. To do that you need to open the Xcode, go to `Project settings` > `Build Phases` and remove the `Start Packager` action.

<img src="/static/images/client/remove_start_packager.png" style={{maxWidth: "100%" }}/>

### Add better error handlers

Sometimes, for certain types of errors, we can provide more helpful error messages than the ones that ship by default with React Native. To turn this feature on you need to import `expo-dev-client` in your `index` file (in the managed workflow, you need to add this import on top of the `App.{js|tsx}`). Make sure that the import statement is above `import App from './App'`.

```js
import 'expo-dev-client';
...
import App from "./App";
```

> Note: This will only affect the application in which you make this change. If you are using your custom client to load multiple applications, you'll need to add this import statement to each of them.

### Loading published updates

The Development Client can also be used to open and preview published updates to your app. To add this feature, you need to add `expo-updates` to your app if it isn't already installed, and add a small additional integration in your `AppDelegate.m` and `MainApplication.java` files.

1. [Install and set up `react-native-unimodules` in your project](../bare/installing-unimodules.md), if you have not already done so.
2. [Install and set up `expo-updates` in your project](../bare/installing-updates.md), if you have not already done so.
3. Make the following changes to complete the integration with `expo-updates`:

<ConfigurationDiff source="/static/diffs/client/app-delegate-updates.diff" />

<ConfigurationDiff source="/static/diffs/client/main-application-updates.diff" />

## 4. Build and Install

You're now ready to [build your first custom client](/clients/getting-started.md#building-and-installing-your-first-custom-client) and to start developing.
