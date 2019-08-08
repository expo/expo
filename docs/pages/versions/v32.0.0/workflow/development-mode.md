---
title: Development Mode
old_permalink: /versions/v12.0.0/guides/development-mode.html
previous___FILE: ./up-and-running.md
next___FILE: ./configuration.md
---

React Native includes some very useful tools for development: remote JavaScript debugging in Chrome, live reload, hot reloading, and an element inspector similar to the beloved inspector that you use in Chrome. It also performs bunch of validations while your app is running to give you warnings if you're using a deprecated property or if you forgot to pass a required property into a component, for example.

![Screenshots of development mode in action](/static/images/development-mode.png)

**This comes at a cost: your app runs slower in development mode.** You can toggle it on and off from Expo Dev Tools and Expo CLI. When you switch it, just close and re-open your app for the change to take effect. **Any time you are testing the performance of your app, be sure to disable development mode**.

## Toggling Development Mode in Expo Dev Tools

To enable development mode, make sure the "Production mode" switch is turned off:

![](/static/images/toggle-development-mode-2.png)

## Toggling Development Mode in Expo CLI

In the terminal with your project running in Expo CLI, press `p` to toggle the production mode.

## Showing the Developer Menu

When in Development Mode, depending on your settings of the Expo client, you will either shake your device or use a two-finger force touch to reveal the Developer Menu. When using an emulator, use the key command ⌘+D for iOS and Ctrl+M for Android.
