---
title: Set up your project and environment
---

Follow these instructions to integrate EAS Build in your existing project.

## 1. Install the latest Expo CLI

Install Expo CLI by running `npm install -g expo-cli` (or `yarn global add expo-cli`). If you already have it, make sure you're using the latest version. EAS Build is in alpha and it's changing rapidly, so the only way to ensure that you will have the best experience is to use the latest expo-cli version.

## 2. Sign in

Sign in with `expo login`, or sign up with `expo register` if you don't have an Expo account yet. You can check if you're logged in by running `expo whoami`.

## 3. Eject to bare workflow if needed

> ✅ You can skip this step if you are using the bare workflow or have a vanilla React Native project.

Building managed Expo projects with EAS Build is not supported yet. We're working hard to deliver this soon! In the meantime, if you wish to build a managed project, you'll have to run `expo eject`. [Learn more here.](../workflow/customizing.md)

## 4. Configure the project

Run `expo eas:build:init` to configure your iOS and Android projects to run on EAS Build.

- **Android**: If you have not yet generated a keystore for your app, you can let Expo take care of that for you. If you have already built your app in the managed workflow with `expo build:android` then the same credentials will be used by EAS Build. If you would rather manually generate your keystore, please see the advanced [Android Credentials](advanced-credentials-configuration.md#android-credentials) section for more information.

- **iOS**: This requires access to a **paid** [Apple Developer Account](https://developer.apple.com/programs) to configure the credentials required for signing your app. Expo will take care of acquiring the credentials for you, and if you have already built your app in the managed workflow with `expo build:ios` then the same credentials will be used by EAS Build. If you would rather manually provide your credentials, refer to the advanced [iOS Credentials](advanced-credentials-configuration.md#ios-credentials) section for more information.

## 5. Run the build

- Run `expo eas:build --platform android` to build for Android.

- Run `expo eas:build --platform ios` to build for iOS.

> 💡 You can run `expo eas:build --platform all` to build for Android and iOS at the same time.

## 6. Check the status of your builds

By default, the `expo eas:build` command will wait for your build to complete. However, if you interrupt this command you can still monitor the progress of your builds by either visiting [the Expo website](https://expo.io/) or running the `expo eas:build:status` command.

## 7. Learn more

- Read the [Configuration with eas.json](eas-json.md) guide to get familiar with EAS Build configuration options.
- If you want to learn more about the internals of Android and iOS builds, check out our [Android build process](android-builds.md) and [iOS build process](ios-builds.md) pages.
- Lastly, if you feel like an expert on credentials configuration, see the [Advanced credentials configuration](advanced-credentials-configuration.md) guide to customize the build process even further.
- Other than that, stay tuned - more features are coming to EAS Build soon!
