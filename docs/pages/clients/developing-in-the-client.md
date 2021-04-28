---
title: Developing In A Custom Client
---

## Get a custom client in your project

If you're just starting your project, you can create a new project from our template with: 
<InstallSection packageName="expo-development-client" cmd={["npx crna -t with-dev-client"]} hideBareInstructions />

If you have an existing project, you'll need [make a few changes to your `AppDelegate.m`, `MainActivity.java` and `MainApplication.java`](installation.md)

## Deep linking scheme

The Development Client uses deep links to open projects from the QR code. If you had added a custom deep link schema to your project, the Development Client will use it. However, if this isn't the case, you need to configure the deep link support for your application. The `uri-scheme` package will do this for you once you have chosen a scheme.

<InstallSection packageName="expo-development-client" cmd={["npx uri-scheme add <your scheme>"]} hideBareInstructions />

## Building your Expo client

You can now build your project and launch it in your simulator or emulator with

<InstallSection packageName="expo-development-client" cmd={["npx uri-scheme add <your scheme>"]} hideBareInstructions />

If you are eager to install your project on a physical device, you can skip ahead to Custom Clients in a Team.  Once its installed, you can just run

<InstallSection packageName="expo-development-client" cmd={["expo start --dev-client"]} hideBareInstructions />


## Loading your application

When you first launch your application, you will see this screen.


If a bundler is available on your local network, or you've signed in to your Expo account, you'll can connect to it directly from this screen.
Otherwise, you can connect by scanning the QR code displayed by Expo CLI.

## Debugging your application

When you need to, you can access the menu by pressing Cmd-d in Expo CLI.  Here you'll be able to access all of the functions of your development client, access any debugging functionality you need, switch to a different version of your application, or [any capabilities you have added yourself](extending-the-dev-menu.md).

