---
title: Up and Running
old_permalink: /versions/v6.0.0/guides/up-and-running.html
previous___FILE: ./index.md
next___FILE: ./installing-node.md
---

The aim of this first guide is to get an Expo application up and running as quickly as possible.

At this point we should have XDE installed on our development machine and the Expo client on an iOS or Android physical device or emulator. If not, go back to the [Installation](/versions/v6.0.0/introduction/installation#installation) guide before proceeding.

Alright, let's get started.

## Creating the project

Open XDE and press `New Project`, create a new directory and give it the name that you would like for your project. I'll call it `first-project`. Select the directory and press `Open`.

XDE is now initializing a new project in selected directory: it copies a basic template and installs `react`, `react-native` and `exponent`.

When the project is initialized and ready to go you will see the message "React packager ready" in the XDE logs.

> **Note:** The "React packager" is a simple HTTP server that compiles our app JavaScript code using [Babel](https://babeljs.io/) and serves it to the Expo app.

## Open the app on your phone or simulator

You'll see that XDE shows you a URL like `http://4v-9wa.notbrent.mynewproject.exp.direct:80`- feel free to open this up in your browser, you will see that it serves up some JSON. This JSON is the Expo manifest. We can open our app by opening the Expo app on our phone typing this URL into the address bar. Alternatively, enter your phone number and press `Send link for Phone`, then tap on the link in your text messages. You can share this link with anybody else who has the Expo app installed, but it will only be available as long as you have the project open in XDE.

To open the app in the iOS simulator you can press the `Open Project in Expo on iOS Simulator` button. To open the app in the Android emulator, first boot it up and then press `Open Project in Expo on Android`.
