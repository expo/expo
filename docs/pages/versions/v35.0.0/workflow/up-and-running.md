---
title: Up and Running
---

The aim of this first guide is to get an Expo application up and running as quickly as possible.

At this point we should have Expo CLI installed on our development machine and the Expo client on an iOS or Android physical device or emulator. If not, go back to the [Installation](../../introduction/installation/) guide before proceeding.

Alright, let's get started.

## Creating the project

Run `expo init` to create a project. You'll be asked to name your project. The project will be created in a new directory with that name in the current working directory. I'll call mine `first-project`, and press Enter.

Next you can choose which project template to use. Choose the `tabs` option since that will give us a good starting point.

Expo CLI is now initializing a new project: it copies a basic template and installs `react`, `react-native` and `expo`.

When the project is initialized and ready to go, the command will exit.

### Start the development server

Navigate to your project folder and type `npm start` to start the local development server of Expo CLI.

Expo CLI starts Metro Bundler, which is an HTTP server that compiles the JavaScript code of our app using [Babel](https://babeljs.io/) and serves it to the Expo app. It also pops up Expo Dev Tools, a control panel for developing your app, in your default web browser.

> **Note:** If you are on MacOS and Expo CLI gets stuck on `Starting project at <path>`, you may need to [install Watchman on your machine](https://facebook.github.io/watchman/docs/install.html#build-install). The easiest way to do this is with [Homebrew](http://brew.sh/), `brew install watchman`.

## Open the app on your phone or simulator

The fastest way to see your app on your device is to log in to Expo CLI with an Expo account (you can sign up by pressing `s` in the terminal window with the development server running, or by running `expo register`) and then use the same account to log in to Expo client mobile app. Once you log in, a link to your current project will automatically appear inside Expo client on your phone.

Alternatively, press `e` in the terminal or `Send link with email/SMS…` in Dev Tools to send a message with a link you can tap on your phone to open the app. You can share this link with anybody else who has the Expo app installed, but it will only be available as long as you have the project running with Expo CLI.

To open the app in the iOS simulator you can press the `i` in the terminal or `Run on iOS simulator` in Dev Tools. To open the app in the Android emulator, first boot it up and then press `a` in the terminal or `Run on Android device/emulator` in Dev Tools.

Lastly, you will also see a QR code in terminal and Dev Tools. One fast way to open your project is to simply scan the QR code with the Expo client app on Android or using the built-in QR code scanner of the Camera app on iOS.

## Making your first change

Open up `screens/HomeScreen.js` in your new project and change any of the text in the `HomeScreen()` component. You should see your app reload with your changes after saving.

### Can't see your changes?

Live reload is enabled by default, but let's just make sure we go over the steps to enable it in case somehow things just aren't working.

- First, make sure you have [development mode enabled in Expo CLI](../development-mode/#development-mode).

- Next, close the app and reopen it.

- Once the app is open again, shake your device to reveal the developer menu. If you are using an emulator, press `⌘+d` for iOS or `ctrl+m` for Android.

- If you see `Enable Live Reload`, press it and your app will reload. If you see `Disable Live Reload` then exit the developer menu and try making another change.

  ![In-app developer menu](/static/images/developer-menu.png)

#### Manually reloading the app

- If you've followed the above steps and live reload **still** doesn't work, [post to Expo Forums](https://forums.expo.io/c/help) to send us a support request. Until we resolve the issue for you, you can either shake the device and press `Reload`, or use one of the following tools which work both with and without development mode.

  ![Refresh using Expo buttons](/static/images/expo-refresh.png)

### Congratulations

You have created a new Expo project, made a change, and seen it update.

### Next Steps

- The [Additional Resources](../../introduction/additional-resources/#additional-resources) has a bunch of useful resources for learning.
- Read about the [Expo SDK](../../sdk/overview/) to learn about some useful APIs we provide out of the box.
- Read some of our other guides, such as how to implement [Push Notifications](../../guides/push-notifications/#push-notifications), how we can take care of [Assets](../../guides/assets/#all-about-assets) for you, or how to build [Standalone Apps](../../distribution/building-standalone-apps/#building-standalone-apps) you can submit to Apple or Google.
- Join us on Slack to get your questions answered.
