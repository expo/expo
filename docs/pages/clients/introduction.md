---
title: Introduction
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight'

**Expo Clients** provide a precompiled runtime that can load and run applications built with Expo. With a compatible client for each platform an application targets, you can focus your time and energy building your application fully in JavaScript and gain the developer experience that Expo is known for:
- Easy for new developers without native experience to join the team
- Quickly verify the impact of changes to your project
- Develop iOS applications without needing a machine running MacOS

<ImageSpotlight alt="Diagram that visualizes the difference between Expo Go and Custom development clients" src="/static/images/development-clients-overview.png" style={{ maxWidth: 605 }} />

Depending on your project, you may find that you need to customize the standard runtime provided in Expo Go, either to reduce your bundle size, to use a module offered by developers in the React Native community, or even to add your own custom native code. At that point, you can create a custom Development Client, install it on your phone, and continue developing.

## What you get with a custom Expo Client

### Improvements to Managed workflow with Expo Go

- Add any native code your project needs
- Develop in the same environment as your released application
- Access to XCode and Android Studio when you need them 

### Improvements to Bare workflow and React Native project

- Develop iOS applications without a machine running MacOS
- Run your application on a physical device without plugging it 
- Develop using any available port
- Quickly connect to your device via QR code
- Improved developer experience of Expo CLI

## How it works

`expo-dev-client` is an npm module, installable in any Expo or React Native project. Once installed, any Debug builds of your application will gain an extensible debug menu and the ability to load projects from Expo CLI. Release builds of your application will not change other than the addition of a few header files.


> ⚠️ **Managed Expo projects are not yet supported**, but we are working on bringing the Development Client to the Managed Workflow! If you want to build a Managed Expo project with the Development Client, you'll have to eject it first. See the [Ejecting to Bare Workflow](../workflow/customizing.md) page to learn how.

## Discover the Dev Client

- [Get Started with the Dev Client](installation.md) - This step-by-step guide will take you through installing the Development Client module in your project
- [Distributing to Android Devices](distribution-for-android.md) - Get your Development Client running on an Android device
- [Distributing to iOS Devices](distribution-for-ios.md) - Get your Development Client running on an iOS device
- [Troubleshooting](troubleshooting.md) - Solutions for common issues you might encounter with the Development Client
- [Extending the Dev Menu](extending-the-dev-menu.md) - Make the Development Client your own by extending the menu with new functionality
- [Compatibility](compatibility.md) - Check compatibly versions
