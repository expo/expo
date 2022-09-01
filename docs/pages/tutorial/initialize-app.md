---
title: Create your first app
---

import { Terminal } from '~/ui/components/Snippet';
import ImageSpotlight from '~/components/plugins/ImageSpotlight';

In this chapter, you'll learn how to create a new Expo project and how to get it running.

## Prerequisites

You'll need the following tools to get started:

- Install [Expo Go](https://expo.dev/client) on your physical device.
- Prepare your computer by [installing required tools and dependencies](https://docs.expo.dev/get-started/installation/#requirements).

This tutorial also assumes you have basic knowledge of JavaScript and React or React Native. If you have never written React code, go through [the official React tutorial](https://reactjs.org/tutorial/tutorial.html) first. For more resources, see [additional resources](https://docs.expo.dev/next-steps/additional-resources/).

## Step 1: Initialize a new Expo app

We provide two different ways to get started:

- [Initialize with the starter template](#initialize-with-the-starter-template)
- [Manually initialize with `create-expo-app`](#alternate-manually-initialize-with--create-expo-app)

Choose a way to initialize your app and open the project repository in your favorite code editor or IDE after initializing it. Throughout this tutorial, we use VS Code for our examples.

### Initialize with the starter template

In the directory of your choice with your preferred terminal, download the starter project using an Expo template:

<Terminal cmd={['$ npx create-expo-app -t expo-tutorial-template']} />

The starter template you are downloading is an Expo project that comes with:

- All dependencies pre-installed that you can use to build and run the app
- All the assets available in the **assets** directory
- Splash screen and app icon already configured

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

## Step 2: Run the app on mobile

After initializing the app, navigate inside the project directory in your terminal.

In the project directory, run the following command to start a [development server](/guides/how-expo-works/#expo-development-server):

<Terminal cmd={['$ npx expo start']} />

Once your development server is running, the best way to develop is on your physical device with Expo Go. [Learn more](/get-started/create-a-new-app/#opening-the-app-on-your-phonetablet) on how to get the project running on your physical device.

Once it is running, your project should look like this:

<ImageSpotlight alt="App running on an iOS simulator and a physical Android device." src="/static/images/tutorial/app-running-on-mobile-platforms.jpg" style={{maxWidth: 480}} />

The text displayed on the app's screen above can be found in the **App.js** file in the root of the project's directory. It is the entry point of the project and is executed when the development server starts.

## Step 3: Install dependencies for the web

When you create a new project with `create-expo-app`, it uses the default [blank template](https://github.com/expo/expo/tree/main/templates/expo-template-blank) that comes pre-configured with necessary dependencies to run your app on mobile platforms. To support the web, you need to add a few additional dependencies to the project. In a terminal, run the following command to install the necessary dependencies to include web support:

<Terminal cmd={['$ npx expo install react-native-web@~0.18.7 react-dom@18.0.0 @expo/webpack-config@^0.17.0']} />

> If you have initialized your app with the starter template, you can skip this step. These dependencies are already installed in the template.

Before running the above installation command, make sure to terminate `npx expo start` if it is already running the development server.

## Step 4: Run the app on the web

After installing the dependencies, run the development server again using `npx expo start`. To see the web app in action, press <kbd>W</kbd> in the terminal window. It will open the web app in your default web browser at a specific URL.

<ImageSpotlight alt="App running on an all platforms" src="/static/images/tutorial/app-running-on-all-platforms.jpg" style={{maxWidth: 720}} />

## Up next

You have now set up an application in the local environment and launched it. The next step is to learn [how to build the first layout of the app](/tutorial/layout).

If you have trouble opening the app on the device of your choice, refer to the [Opening the app on your phone/tablet](/get-started/create-a-new-app/#opening-the-app-on-your-phonetablet) section.
