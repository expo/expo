---
title: Getting Started
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight'
import InstallSection from '~/components/plugins/InstallSection'
import { Tab, Tabs } from '~/components/plugins/Tabs';

## Install the Development Client module in your project

<Tabs tabs={["With config plugins", "If you are directly managing your native projects"]}>

<Tab >
<InstallSection packageName="expo-dev-client" cmd={["expo init # if you don't already have a Managed Workflow project", "yarn add expo-dev-client"]} hideBareInstructions />

</Tab>

<Tab >

If you're just starting your project, you can create a new project from our template with:

<InstallSection packageName="expo-dev-client" cmd={["npx crna -t with-dev-client"]} hideBareInstructions />

If you have an existing project, you'll need to [install the package and make a few changes](installation.md) to your `AppDelegate.m`, `MainActivity.java` and `MainApplication.java`.

The Development Client uses deep links to open projects from the QR code. If you had added a custom deep link schema to your project, the Development Client will use it. However, if this isn't the case, you need to configure the deep link support for your application. The `uri-scheme` package will do this for you once you have chosen a scheme.

<InstallSection packageName="expo-dev-client" cmd={["npx uri-scheme add <your scheme>"]} hideBareInstructions />

</Tab>

</Tabs>

## Building your Development Client

You can now build your project and launch it in your iOS simulator

<InstallSection packageName="expo-dev-client" cmd={["expo run:ios"]} hideBareInstructions />

or your Android emulator

<InstallSection packageName="expo-dev-client" cmd={["expo run:android"]} hideBareInstructions />

If you are eager to install your project on a physical device, we recommend using [EAS Build](eas-build.md) for the smoothest experience, but you can build and distribute the same as any other React Native application. Once its installed, you're ready to start developing by running:

<InstallSection packageName="expo-dev-client" cmd={["expo start --dev-client"]} hideBareInstructions />

## Loading your application

When you first launch your application, you will see a screen that looks like this:

<ImageSpotlight alt="The launcher screen of the Development Client" src="/static/images/dev-client-launcher.png" style={{ maxWidth: 225}} />

If a bundler is available on your local network, or you've signed in to your Expo account, you'll can connect to it directly from this screen.
Otherwise, you can connect by scanning the QR code displayed by Expo CLI.

## Debugging your application

When you need to, you can access the menu by pressing Cmd-d in Expo CLI or by shaking your phone or tablet. Here you'll be able to access all of the functions of your Development Client, access any debugging functionality you need, switch to a different version of your application, or [any capabilities you have added yourself](extending-the-dev-menu.md).
