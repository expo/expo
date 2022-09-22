---
title: Create your first app
---

import { Terminal } from '~/ui/components/Snippet';
import ImageSpotlight from '~/components/plugins/ImageSpotlight';

In this chapter, let’s learn how to create a new Expo project and how to get it running.

## Prerequisites

We’ll need the following tools to get started:

- Install [Expo Go](https://expo.dev/client) on a physical device.
- Prepare for development by [installing the required tools and dependencies](https://docs.expo.dev/get-started/installation/#requirements).

This tutorial also assumes that you have a basic knowledge of JavaScript and React or React Native. If you have never written React code, go through [the official React tutorial](https://reactjs.org/tutorial/tutorial.html) first. For more resources, see [additional resources](https://docs.expo.dev/next-steps/additional-resources/).

## Step 1: Initialize a new Expo app

We provide two different ways to get started:

- [Initialize with the starter template](#initialize-with-the-starter-template)
- [Manually initialize with `create-expo-app`](#alternate-manually-initialize-with--create-expo-app)

Choose a way to initialize the app and open the project repository in your favorite code editor or IDE after initializing it. Throughout this tutorial, we use VS Code for our examples.

### Initialize with the starter template

In the directory of your choice with your preferred terminal, download the starter project using an Expo template:

<Terminal cmd={['$ npx create-expo-app -t expo-tutorial-template']} />

The starter template we are downloading is an Expo project that comes with:

- All dependencies pre-installed that can be used to build and run the app
- All the assets available in the **assets** directory
- Splash screen and app icon already configured

The starter template uses [`create-expo-app`](/workflow/glossary-of-terms/#create-expo-app). It is a command line tool that allows creating a new React Native project with `expo` package installed. The template we are using for this tutorial is a special version created from the basic template that `create-expo-app` produces.

### Alternate: manually initialize with `create-expo-app`

If you prefer to create everything from scratch, you can use the `create-expo-app` command to initialize a new Expo project.

In the directory of your choice with your preferred terminal, run the following command to initialize a new project:

<Terminal cmd={[
'# Create a project named StickerSmash',
'$ npx create-expo-app StickerSmash',
'',
'# Navigate to the project directory',
'$ cd StickerSmash'
]} cmdCopy="npx create-expo-app StickerSmash && cd StickerSmash" />

This command will create a new directory for the project with the name: **StickerSmash**.

## Step 2: Run the app on mobile and web

After initializing the app, navigate inside the project directory in the terminal.

In the project directory, run the following command to start a [development server](/guides/how-expo-works/#expo-development-server):

<Terminal cmd={['$ npx expo start']} />

Once the development server is running, the best way to develop is on your physical device with Expo Go. [Learn more](/get-started/create-a-new-app/#opening-the-app-on-your-phonetablet) on how to get the project running on your physical device.

To see the web app in action, press <kbd>w</kbd> in the terminal. It will open the web app in your default web browser at a specific URL.

Once it is running on all platforms, your project should look like this:

<ImageSpotlight alt="App running on an all platforms" src="/static/images/tutorial/app-running-on-all-platforms.jpg" style={{maxWidth: 720}} />

The text displayed on the app's screen above can be found in the **App.js** file at the root of the project's directory. It is the entry point of the project and is executed when the development server starts.

## Up next

If you have trouble opening the app on the device of your choice, refer to the [Opening the app on your phone/tablet](/get-started/create-a-new-app/#opening-the-app-on-your-phonetablet) section.

You have now initialized an Expo project on your computer and you're ready to start developing StickerSmash. The next step is to learn [how to build the first screen of the app](/tutorial/layout).
