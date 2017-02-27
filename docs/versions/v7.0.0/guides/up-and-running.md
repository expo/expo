---
title: Up and Running
old_permalink: /versions/v7.0.0/guides/up-and-running.html
previous___FILE: ./index.md
next___FILE: ./configuration.md
---

The aim of this first guide is to get an Expo application up and running as quickly as possible.

At this point we should have XDE installed on our development machine and the Expo client on an iOS or Android physical device or emulator. If not, go back to the [Installation](/introduction/installation.html) guide before proceeding.

Alright, let's get started.

## Create an account

Upon opening XDE you will be prompted for a username and password. Fill this in with your desired username and password and hit continue -- if the username isn't already taken, then we will automatically create the account for you.

## Creating the project

Press `Project` and select `New Project`, then enter the name of your project in the dialog that pops up. I'll call mine `first-project`, and press create.

Next, choose where to save the project. I keep all of my fun projects in `~/coding`, so I navigate to that directory and press open.

XDE is now initializing a new project in selected directory: it copies a basic template and installs `react`, `react-native` and `exponent`.

When the project is initialized and ready to go you will see the message "React packager ready" in the XDE logs.

> **Note:** The "React packager" is a simple HTTP server that compiles our app JavaScript code using [Babel](https://babeljs.io/) and serves it to the Expo app.

## Open the app on your phone or simulator

You'll see that XDE shows you a URL like `http://4v-9wa.notbrent.mynewproject.exp.direct:80`- feel free to open this up in your browser, you will see that it serves up some JSON. This JSON is the Expo manifest. We can open our app by opening the Expo app on our phone typing this URL into the address bar. Alternatively, press `Send Link`, enter your phone number, and press `Send Link` again. Open the message on your phone and tap on the link to open it in Expo. You can share this link with anybody else who has the Expo app installed, but it will only be available as long as you have the project open in XDE.

To open the app in the iOS simulator you can press the `Device` button and choose `Open on iOS` (Mac only). To open the app in the Android emulator, first boot it up and then press `Device` and `Open on Android`.
