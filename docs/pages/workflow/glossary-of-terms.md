---
title: Glossary of terms
---

### app.json

`app.json` is a file that exists for every Expo project and it is used to configure your project, for example the name, icon, and splash screen. [Read more in "Configuration with app.json / app.config.js"](configuration.md)

### create-react-native-app

Formerly the React Native equivalent of [create-react-app](https://github.com/facebookincubator/create-react-app). This has since been replaced with `expo-cli`.

### detach

The term "detach" was previously used in Expo to mean [ejecting](#eject) your app to use [ExpoKit](#expokit).

### eject

The term "eject" was popularized by [create-react-app](https://github.com/facebookincubator/create-react-app), and it is used in Expo to describe leaving the cozy comfort of the standard Expo development environment, where you do not have to deal with build configuration or native code. When you "eject" from Expo, you have two choices:

- _Eject to bare workflow_, where you jump between [workflows](../introduction/managed-vs-bare.md) and move into the bare workflow, where you can continue to use Expo APIs but have access and full control over your native iOS and Android projects.
- _Eject to ExpoKit_, where you get the native projects along with [ExpoKit](#expokit). This option is deprecated and support for ExpoKit will be removed after SDK 38. We recommend ejecting to the bare workflow instead.

### Emulator

Emulator is used to describe software emulators of Android devices on your computers. Typically iOS emulators are referred to as [Simulators](#simulator).

### Experience

A synonym for app that usually implies something more single-use and smaller in scope, sometimes artistic and whimsical.

### Expo CLI

The command-line tool for working with Expo. [Read more](expo-cli.md).

### Expo client

The iOS and Android app that runs Expo apps. When you want to run your app outside of the Expo client and deploy it to the App and/or Play stores, you can build a [Standalone App](#standalone-app).

### Expo Dev Tools

Expo Developer Tools is a web browser based UI included in [Expo CLI](#expo-cli).

### Expo SDK

The Expo SDK provides access to device/system functionality such as camera, push notification, contacts, file system, and more. Scroll to the SDK API reference in the documentation navigation to see a full list of APIs and to explore them. [Read more about the Expo SDK](/versions/latest/). [Find it on Github](https://github.com/expo/expo-sdk).

### ExpoKit

ExpoKit is an Objective-C and Java library that allows you to use the [Expo SDK](#expo-sdk) and platform and your existing Expo project as part of a larger standard native project — one that you would normally create using Xcode, Android Studio, or `react-native init`. [Read more](../expokit/eject.md).

**ExpoKit is deprecated and support for ExpoKit will be removed after SDK 38. We recommend ejecting to the bare workflow instead.**

### iOS

The operating system used on iPhone, iPad, and Apple TV. Expo currently runs on iOS for iPhone and iPad.

### Linking

Linking can mean [deep linking into apps similar to how you link to websites on the web](linking.md) or [linking native libraries into your ejected ExpoKit app](../expokit/expokit.md#changing-native-dependencies).

### Manifest

An Expo app manifest is similar to a [web app manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest) - it provides information that Expo needs to know how to run the app and other relevant data. [Read more in "How Expo Works"](how-expo-works.md#expo-manifest).

### Native Directory

The React Native ecosystem has thousands of libraries. Without a purpose-built tool, it's hard to know what the libraries are, to search through them, to determine the quality, try them out, and filter out the libraries that won't work for your project (some don't work with Expo, some don't work with Android or iOS). [Native Directory](http://native.directory/) is a website that aims to solve this problem, we recommend you use it to find packages to use in your projects.

### npm

[npm](https://www.npmjs.com/) is a package manager for JavaScript and the registry where the packages are stored. An alternative package manager, which we use internally at Expo, is [yarn](#yarn).

### Over the Air updates

Traditionally, apps for iOS and Android are updated by submitting an updated binary to the App and Play stores. Over the Air (OTA) updates allow you to push an update to your app without the overhead of submitting a new release to the stores. [Read more in "Publishing"](publishing.md).

### Package Manager

Automates the process of installing, upgrading, configuring, and removing libraries, also known as dependencies, from your project. See [npm](#npm) and [yarn](#yarn).

### Publish

We use the word "publish" as a synonym for "deploy". When you publish an app, it becomes available at a persistent URL from the Expo client, or in the case of [Standalone apps](#standalone-app), it updates the app [over the air](#over-the-air-updates).

### React Native

"React Native lets you build mobile apps using only JavaScript. It uses the same design as React, letting you compose a rich mobile UI from declarative components." [Read more](https://reactnative.dev/).

### Shell app

Another term we occasionally use for [Standalone app](#standalone-app).

### Simulator

An emulator for iOS devices that you can run on macOS (or in [Snack](#snack)) to work on your app without having to have a physical device handy.

### Slug

We use the word "slug" in [app.json](#appjson) to refer to the name to use for your app in its url. For example, the [Native Component List](https://expo.io/@community/native-component-list) app lives at https://expo.io/@community/native-component-list and the slug is native-component-list.

### Snack

[Snack](https://snack.expo.io/) is an in-browser development environment where you can build Expo [experiences](#experience) without installing any tools on your phone or computer.

### Standalone app

An application binary that can be submitted to the iOS App Store or Android Play Store. [Read more in "Building Standalone Apps"](../distribution/building-standalone-apps.md).

### XDE

XDE was a desktop tool with a graphical user interface (GUI) for working with Expo projects. It's been replaced by [Expo CLI](#expo-cli), which now provides both command line and web interfaces.

### yarn

A package manager for JavaScript. [Read more](https://yarnpkg.com/)
