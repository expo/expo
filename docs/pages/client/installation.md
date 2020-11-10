---
title: Installation
---

import InstallSection from '~/components/plugins/InstallSection';
import ConfigurationDiff from '~/components/plugins/ConfigurationDiff';

**Expo Dev Client** is an open source project to improve your development experience while working on your Expo and React Native projects. It allows your team to focus on the JavaScript portion of your project, only needing to interact with XCode or Android Studio when you need to make changes to the native code used in your project.

> ⚠️ **Managed Expo projects are not yet supported**, but we are working on bringing it to EAS Build! If you want to build a managed Expo project with the Development Client, you'll have to eject it first. See the [Ejecting to Bare Workflow](../workflow/customizing.md) page to learn how.

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

## 2. Install expo-dev-menu

Dev Menu provides a menu within builds of your project that provide access to common debugging functionality. This menu is a drop-in replacement for the standard React Native debugging menu that can be extended with new options to meet your team's unique needs.

<InstallSection packageName="expo-dev-client" cmd={["npm install expo-dev-menu expo-dev-menu-interface"]} hideBareInstructions />

### Configuration for iOS

<ConfigurationDiff source="/static/diffs/dev-menu-ios.diff" />

<br />

#### Install CocoaPods

Now run `npx pod-install` to install and link the libraries.

### Configuration for Android

<ConfigurationDiff source="/static/diffs/dev-menu-android.diff" />

## 3. Install expo-development-client

The Dev Client module provides an easy way to connect your built application to a local bundler, allowing your team to work on the javascript portion of your application without ever having to load XCode or Android Studio.

<InstallSection packageName="expo-development-client" cmd={["npm install expo-development-client expo-barcode-scanner", "npx pod-install"]} hideBareInstructions />

### Configuration for iOS

<ConfigurationDiff source="/static/diffs/dev-ios.diff" />

### Configuration for Android

<ConfigurationDiff source="/static/diffs/dev-android.diff" />

<br />

#### Manually enable camera permissions in Android OS settings

On Android, you need to go into the OS and manually grant yourself the camera permission
