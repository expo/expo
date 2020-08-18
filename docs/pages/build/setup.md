---
title: Setup
---

Follow these instructions to get ready for using EAS Builds.

## 1. Install Expo CLI

Install Expo CLI by running `npm install -g expo-cli` (or `yarn global add expo-cli`). If you already have it, make sure you're using the latest version. EAS Builds is in alpha and it's changing rapidly, so the only way to ensure that you will have the best experience is to use the latest expo-cli version.

## 2. Sign In

Sign in with `expo login`, or sign up with `expo register` if you don't have an Expo account yet. You can check if you're logged in by running `expo whoami`.

## 3. Create eas.json

To start using EAS Builds, you'll need to create the `eas.json` file in the root of your project. Creating this file will enable new Expo CLI commands for you, namely `expo eas:build` and `expo eas build:status`.

Let's start with the following minimal configuration:

```json
{
  "builds": {
    "android": {
      "release": {
        "workflow": "generic"
      }
    },
    "ios": {
      "release": {
        "workflow": "generic"
      }
    }
  }
}
```

If you want to learn more about the configuration options see the [Configuring with eas.json](../eas-json/) page.

## 4. Eject Your Managed Project

**⚠️ Do not follow this step if you are using the bare workflow or a vanilla React Native project.**

Building managed Expo projects with EAS Builds is not supported yet. We're working hard to deliver this soon!

In the meantime, if you wish to build a managed project, you'll have to run `expo eject`. [Learn more here.](../../workflow/customizing/)

## 5. If Building for Android...

If you're building your Android application for the first time, you'll have to generate a keystore. To do so, you'll need the `keytool` command installed and searchable in `PATH`. `keytool` is distributed with Java Development Kit. We recommend you [install JDK version 8](https://jdk.java.net/) as this specific version is needed for building Android apps.

See the [Android Credentials](../advanced-credentials-configuration/#android-credentials) section in the **Advanced Credentials Configuration** page to learn more about Android credentials.

## 6. If Building for iOS...

You’ll need a **paid** [Apple Developer Account](https://developer.apple.com/programs) to configure credentials required for the development and distribution process of an app.

See the [iOS Credentials](../advanced-credentials-configuration/#ios-credentials) section in the **Advanced Credentials Configuration** page to learn more about iOS credentials.

## 7. Run the Build

Run `expo eas:build --platform android` to build for Android, `expo eas:build --platform ios` to build for iOS, or `expo eas:build --platform all` to build for both platforms.

## 8. Check the Status of Your Builds

By default, the `expo eas:build` command will wait for your build to complete. However, if you interrupt this command you can still monitor the progress of your builds by either visiting [the Expo website](https://expo.io/) or running the `expo eas:build:status` command.

## 9. Learn More

- Read the [Configuring with eas.json](../eas-json/) guide to get familiar with EAS Builds configuration options.
- If you want to learn more about the internals of Android and iOS builds, check out our [Android Builds](../android-builds/) and [iOS Builds](../ios-builds/) pages.
- Lastly, if you feel like an expert on credentials configuration, see the [Advanced Credentials Configuration](../advanced-credentials-configuration/) guide to customize the build process even further.
- Other than that, stay tuned - more features are coming to EAS Builds soon!
