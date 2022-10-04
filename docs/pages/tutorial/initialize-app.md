---
title: Create your first app
---

import { Terminal } from '~/ui/components/Snippet';
import ImageSpotlight from '~/components/plugins/ImageSpotlight';
import { LinkBase } from '~/ui/components/Text';

In this chapter, let’s learn how to create a new Expo project and how to get it running.

## Prerequisites

We’ll need the following tools to get started:

- Install <LinkBase href="https://expo.dev/client" openInNewTab>Expo Go</LinkBase> on a physical device.
- Prepare for development by <LinkBase href="/get-started/installation/#requirements" openInNewTab>installing the required tools and dependencies</LinkBase>.

This tutorial also assumes that you have a basic knowledge of JavaScript and React. If you have never written React code, go through <LinkBase href="https://reactjs.org/tutorial/tutorial.html" openInNewTab>the official React tutorial</LinkBase>.

## Step 1: Initialize a new Expo app

We will use <LinkBase href="/workflow/glossary-of-terms/#create-expo-app" openInNewTab>`create-expo-app`</LinkBase> to initialize a new Expo app. It is a command line tool that allows creating a new React Native project with `expo` package installed.

It will create a new project directory and install all the necessary dependencies to get the project up and running locally. Run the following command in your terminal:

<Terminal cmd={[
'# Create a project named StickerSmash',
'$ npx create-expo-app StickerSmash',
'',
'# Navigate to the project directory',
'$ cd StickerSmash'
]} cmdCopy="npx create-expo-app StickerSmash && cd StickerSmash" />

This command will create a new directory for the project with the name: **StickerSmash**.

Let's also <a href="/static/images/tutorial/sticker-smash-assets.zip" download>download the assets</a> that we will need throughout this tutorial. After downloading the archive, paste the contents to the **assets** directory in your project.

Now, let's open the project directory in our favorite code editor or IDE. Throughout this tutorial, we use VS Code for our examples.

## Step 2: Run the app on mobile and web

After initializing the app, navigate inside the project directory in the terminal.

In the project directory, run the following command to start a <LinkBase href="/guides/how-expo-works/#expo-development-server" openInNewTab>development server</LinkBase>:

<Terminal cmd={['$ npx expo start']} />

Once the development server is running, the easiest way to launch the app is on a physical device with Expo Go.

To see the web app in action, press <kbd>w</kbd> in the terminal. It will open the web app in the default web browser.

Once it is running on all platforms, the project should look like this:

<ImageSpotlight alt="App running on an all platforms" src="/static/images/tutorial/app-running-on-all-platforms.jpg" style={{maxWidth: 720}} />

The text displayed on the app's screen above can be found in the **App.js** file which is at the root of the project's directory. It is the entry point of the project and is executed when the development server starts.

## Up next

We have now created a new Expo project and are ready to start developing our **StickerSmash** app. In the next chapter we will learn [how to build the first screen of the app](/tutorial/layout).
