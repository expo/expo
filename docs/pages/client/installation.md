---
title: Installation
---

import InstallSection from '~/components/plugins/InstallSection';
import ConfigurationDiff from '~/components/plugins/ConfigurationDiff';

**Expo Dev Client** is an open source project to improve your development experience while working on your Expo and React Native projects. It allows your team to focus on the JavaScript portion of your project, only needing to interact with XCode or Android Studio when you need to make changes to the native code used in your project.

> ⚠️ **Managed Expo projects are not yet supported**, but we are working on bringing the Development Client to the Managed Workflow! If you want to build a managed Expo project with the Development Client, you'll have to eject it first. See the [Ejecting to Bare Workflow](../../workflow/customizing/) page to learn how.

<!-- ## Dream Instructions


### The easiest way to get started is to initialize a new project.

All of our default templates start with expo-dev pre installed.
<InstallSection packageName="expo-dev" cmd={["expo init my-project", "cd my-project", "npx pod-install"]} hideBareInstructions />

### If you are upgrading an existing expo project

<InstallSection packageName="expo-dev" cmd={["expo install expo-dev"]} hideBareInstructions />

### If you have an existing react-native project

If you're installing this in a bare React Native app, you should also follow [these additional install instructions](/client/coming-from-react-native/)
<br/>
<br/>
<br/>

# Real instructions -->

## 1. Ensure your project meets prerequisites

You should have an Expo bare workflow project - you can create it with `expo init` or by running `expo eject` on a managed project. If you have an existing React Native project, you will need to [install react-native-unimodules](../bare/installing-unimodules.md) and [install expo-updates](../bare/installing-updates.md) before proceeding.

## 2. Installation

Add the Expo Development Client packages to your package.json.

<InstallSection packageName="expo-dev-client" cmd={["npm install expo-dev-menu expo-dev-menu-interface expo-development-client"]} hideBareInstructions />

[Want to learn more about how these modules work?](/client/submodules/)

### IOS

On iOS, the native code for the Development Client is installed via Cocoapods.

<InstallSection packageName="expo-dev-client" cmd={["npx pod-install"]} hideBareInstructions />

### ANDROID

On Android, you'll need to tell Gradle how to find the dependencies.

<ConfigurationDiff source="/static/diffs/dev-client-gradle.diff" />

## 3. Basic configuration

### IOS

Enable camera and microphone permissions for the in app QR scanner

<ConfigurationDiff source="/static/diffs/dev-client-info-plist.diff" />

And allow the Development Client to control project initialization in DEBUG mode.

<ConfigurationDiff source="/static/diffs/dev-client-app-delegate.diff" />

### ANDROID

Make the following changes to allow the Development Client to control project initialization in DEBUG mode.

If you have a custom activity in your application already, or just want to understand what DevMenuAwareReactActivity is doing, you can see [advanced instructions for Android here.](https://github.com/expo/expo/tree/master/packages/expo-dev-menu#-android)

<ConfigurationDiff source="/static/diffs/dev-client-main-activity-application.diff" />

## 4. Build and Install

You're now ready to start developing your project with the Development Client.

## Next Steps

- [EAS Build](../eas-build/) - the easiest way to generate Development builds of your application

- [Building Locally for iOS](../distribution-for-ios/) - if you need to run your own builds for any reason
- [Building Locally for Android](../distribution-for-ios/) - if you need to run your own builds for any reason
- [Troubleshooting](../troubleshooting) - Solutions for common issues you might encounter with the development client
- [Extending the Development Menu](../extending-the-development-menu/) - Add functionality to the Development Menu.
