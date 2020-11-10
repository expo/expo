---
title: EAS Build from scratch in 5 minutes
---

Let's get started by building Android and iOS app binaries for a fresh bare project initialized with Expo CLI.

## Prerequisites

- Install Expo CLI by running `npm install -g expo-cli` (or `yarn global add expo-cli`). _If you already have it, make sure you're using the latest version._ EAS Build is in alpha and it's changing rapidly, so the only way to ensure that you will have the best experience is to use the latest expo-cli version. **This tutorial assumes you're using `expo-cli@3.25.0` or newer.**
- Sign in with `expo login`, or sign up with `expo register` if you don't have an Expo account yet. You can check if you're logged in by running `expo whoami`.

## Initialize a New Project

Run `expo init PROJECT_NAME` (let's assume `PROJECT_NAME` is `abcd`) and choose a bare workflow template (either `minimal` or `minimal (TypeScript)`).

<center><img src="/static/images/eas-builds/5-minute-tutorial/01-init.png" /></center>

Initializing the project can take a few minutes. Once it's all set, you should see `✅ Your project is ready!` in logs.

<center><img src="/static/images/eas-builds/5-minute-tutorial/02-init-complete.png" /></center>

## Set a bundle identifier for iOS

Before configuring the project for EAS Build, you'll need to set the bundle identifier (`expo.ios.bundleIdentifer`) that will be used to identify your application on the Apple App Store.

An excerpt from Apple's docs:

> The bundle identifier string identifies your application to the system. This string must be a uniform type identifier (UTI) that contains only alphanumeric (A-Z,a-z,0-9), hyphen (-), and period (.) characters. The string should also be in reverse-DNS format. For example, if your company’s domain is Ajax.com and you create an application named Hello, you could assign the string com.Ajax.Hello as your application’s bundle identifier.

To set the bundle identifier, open `app.json`, and add a `bundleIdentifier` property under the `expo.ios` key, then commit the change:

- `git add app.json`
- `git commit -m "Set bundle identifier"`

<center><img src="/static/images/eas-builds/5-minute-tutorial/03-set-bundle-id.png" /></center>

## Configure your project for EAS Build

To automatically configure your native project for building with EAS Build on Android and iOS, you will need to run the following command:

```sh
expo eas:build:init
```

It will automatically perform the following steps:

### Create `eas.json`

The command will create an `eas.json` file in the root directory, and then you'll be asked to commit it. This file contains your EAS Build configuration.

<center><img src="/static/images/eas-builds/5-minute-tutorial/04-eas-json.png" /></center>

This is a minimal example configuration for Android and iOS builds. It defines a single build profile named `release` (you can have multiple build profiles like `release`, `debug`, `testing`, etc.) for each platform. Each profile declares that the project is a generic React Native project (unlike a managed Expo project which doesn't contain native code in the project tree).

If you want to learn more about `eas.json` see the [Configuration with eas.json](eas-json.md) page.

Once you've created `eas.json`, new Expo CLI commands should become available for you:

- `expo eas:build` - manages the whole build process, which consists of: credentials management, project auto-configuration, running the build, and waiting for it to finish
- `expo eas:build:status` - displays the status of your latest build for this project
- `expo eas:credentials:sync` - synchronizes your local credentials.json file and your credentials that Expo has stored on our servers

### Configuring Android

You will be guided through generating or providing your own keystore. For the sake of simplicity in this tutorial, select `Generate new keystore` and hit `ENTER`.

**Warning: If you've previously set up credentials for an app with the same slug, Expo CLI will try to reuse them.**

<center><img src="/static/images/eas-builds/5-minute-tutorial/05-generate-keystore.png" /></center>

Next, Expo CLI will auto-configure you Gradle project so we could build it on our servers. You'll be offered to commit the changes to your repository.

<center><img src="/static/images/eas-builds/5-minute-tutorial/06-configure-gradle.png" /></center>

In addition, if `expo-updates` is installed, Expo CLI will also configure the relevant values such as the `sdkVersion`, `updateUrl` etc. You'll be offered to commit the changes to your repository.

<center><img src="/static/images/eas-builds/5-minute-tutorial/07-configure-updates-android.png" /></center>

### Configuring iOS

First, you'll be asked which bundle identifier to use. Choose the one defined in `app.json`:

<center><img src="/static/images/eas-builds/5-minute-tutorial/08-choose-bundle-id.png" /></center>

Next, you'll be guided through generating the app's credentials and configuring your iOS project, then you'll be asked to commit the changes.

**Warning: If you've previously set up credentials for an app with the same slug, Expo CLI will try to reuse them.**

<center><img src="/static/images/eas-builds/5-minute-tutorial/09-configure-ios.png" /></center>

In addition, if `expo-updates` is installed, Expo CLI will also configure the relevant values such as the `sdkVersion`, `updateUrl` etc. You'll be offered to commit the changes to your repository.

<center><img src="/static/images/eas-builds/5-minute-tutorial/10-configure-updates-ios.png" /></center>

## Building for Android

Run `expo eas:build --platform android` and Expo CLI will print a URL to the page where you can monitor the build (and view logs). Open the URL in a browser and you should see a page like this:

<center><img src="/static/images/eas-builds/5-minute-tutorial/11-android-build-progress-website.png" /></center>
<center><img src="/static/images/eas-builds/5-minute-tutorial/12-android-build-logs.png" /></center>

Once the build completes you can download the app binary by either visiting the build status page (and clicking the download button), or by opening the URL printed by Expo CLI:

<center><img src="/static/images/eas-builds/5-minute-tutorial/13-android-build-completed-website.png" /></center>
<center><img src="/static/images/eas-builds/5-minute-tutorial/14-android-build-completed-cli.png" /></center>

## Building for iOS

Run `expo eas:build --platform ios` and you'll be asked to login to the Apple Developer Portal and choose your team for the iOS project. Then you'll be provided with the URL to the build logs page.

<center><img src="/static/images/eas-builds/5-minute-tutorial/15-ios-build-completed-cli.png" /></center>

Once the build completes you can download the app binary the same way you did with the Android counterpart - either via the build status page or opening the URL that's printed to your console.

<center><img src="/static/images/eas-builds/5-minute-tutorial/16-ios-build-completed-website.png" /></center>
