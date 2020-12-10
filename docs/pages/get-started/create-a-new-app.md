---
title: Create a new app
sidebar_title: Create a new app
---

import TerminalBlock from '~/components/plugins/TerminalBlock';

At this point we should have Expo CLI installed on our development machine and the Expo client on an iOS or Android physical device or emulator. If not, go back to the [Installation](../get-started/installation.md) guide before proceeding.

## Initializing the project

<TerminalBlock cmd={['# Create a project named my-app. Select the "blank" template when prompted', 'expo init my-app', '', '# Navigate to the project directory', 'cd my-app']} />

## Starting the development server

<TerminalBlock cmd={['expo start']} />

When you run `expo start` (or `npm start`), Expo CLI starts Metro Bundler, which is an HTTP server that compiles the JavaScript code of our app using [Babel](https://babeljs.io/) and serves it to the Expo app. It also pops up Expo Dev Tools, a graphical interface for Expo CLI.

> 👋 You can close the Expo Dev Tools window and disable it from starting in the future by pressing `shift+d` in your terminal running Expo CLI. Start it again at any time by pressing `d` in the terminal running Expo CLI.

## Opening the app on your phone/tablet

> 👨‍👩‍👧‍👧 You can open the project on multiple devices simultaneously. Go ahead and try it on an iPhone and Android phone at the same time if you have both handy.

- 🍎 On your iPhone or iPad, open the default Apple "Camera" app and scan the QR code you see in the terminal or in Expo Dev Tools.
- 🤖 On your Android device, press "Scan QR Code" on the "Projects" tab of the Expo client app and scan the QR code you see in the terminal or in Expo Dev Tools.

<details><summary><h4>Is the app not loading on your device?</h4></summary>
<p>

First, make sure that you are on the same wifi network on your computer and your device.

If it still doesn't work, it may be due to the router configuration &mdash; this is common for public networks. You can work around this by choosing the "Tunnel" connection type in Expo Dev Tools, then scanning the QR code again.

> 🐢 Using the "Tunnel" connection type will make app reloads considerably slower than on "LAN" or "Local", so it's best to avoid tunnel when possible. You may want to install a simulator/emulator to speed up development if "Tunnel" is required for accessing your machine from another device on your network.

</p>
</details>

<details><summary><h4>Using a simulator or emulator?</h4></summary>
<p>

If you are using a simulator or emulator, you may find the following Expo CLI keyboard shortcuts to be useful:

- Pressing `i` will open in an [iOS simulator](../workflow/ios-simulator.md).
- Pressing `a` will open in an [Android emulator or connected device](../workflow/android-studio-emulator.md).
- Pressing `w` will open in your browser. Expo supports all major browsers.

</p>
</details>

## Making your first change

Open up `App.js` and change the text to "Hello, world!". You should see it update on your device. This is great progress, we now have the Expo toolchain running on our machine and we are able to edit the source code for a project and see the changes live on our device!

<details style={{paddingTop: 0}}><summary><h4>Are the changes not showing up on your device?</h4></summary>
<p>

The Expo client is configured by default to automatically reload the app whenever a file is changed, but let's just make sure we go over the steps to enable it in case somehow things just aren't working.

- First, make sure you have [development mode enabled in Expo CLI](../workflow/development-mode.md#development-mode).
- Next, close the app and reopen it.
- Once the app is open again, shake your device to reveal the developer menu. If you are using an emulator, press `⌘+d` for iOS or `ctrl+m` for Android.
- If you see `Enable Fast Refresh`, press it. If you see `Disable Fast Refresh`, then dismiss the developer menu. Now try making another change.<br/><br/>

  ![In-app developer menu](/static/images/developer-menu.png)

</p>
</details>

## Up next

Let's face it: you are going to make mistakes and typos and you are going to get warnings and errors in your app. So [let's learn a little bit about how to read and interpret errors](../get-started/errors.md).
