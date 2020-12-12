---
title: Create your first build
---

In this guide you will learn how to build a ready-to-submit binary for the Apple App Store and Google Play store with EAS Build. For a simple app, it shouldn't take more than a few minutes total to kick off your builds for both Android and iOS.

## Prerequisites


EAS Build is a brand new and rapidly evolving service. It can't do everything yet, so before you set out to create a build for your project we recommend consulting the [limitations](/build-reference/limitations.md) page and the other prequisites below.

<details><summary><h4>📦 A React Native iOS and/or Android project that you want to build.</h4></summary>
<p>

- Install Expo CLI by running `npm install -g expo-cli` (or `yarn global add expo-cli`).
- Run `expo init PROJECT_NAME` (let's assume `PROJECT_NAME` is `abcd`) and choose a bare workflow template (either `minimal` or `minimal (TypeScript)`).
- EAS Build also works well with projects created by `npx react-native`, `create-react-native-app` `ignite-cli`, and other project bootstrapping tools.

<center><img src="/static/images/eas-build/walkthrough/01-init.png" /></center>

</p>
</details>

> EAS Build has early and rapidly improving support for managed workflow projects, but we recommend using it with bare React Native projects for best results right now.

<details><summary><h4>💡 An Expo account with an EAS Priority Plan subscription.</h4></summary>
<p>

- You can sign up for an Expo account at [https://expo.io/signup](https://expo.io/signup).
- Learn more about the EAS Priority Plan and sign up for a free month at [https://expo.io/pricing](https://expo.io/pricing).

</p>
</details>

> While EAS Build is in preview, it is only available to EAS Priority Plan subscribers. Once it graduates from preview it will become more broadly available. The first month is free, cancel any time.

## 1. Install the latest EAS CLI

Install EAS CLI by running `npm install -g eas-cli` (or `yarn global add eas-cli`). It will notify you when a new version is available, we encourage you to always stay up to date with the latest version.

## 2. Log in to your Expo account

If you are already signed in through Expo CLI, you don't need to do anything. Otherwise, log in with `eas login`. You can check if you're logged in by running `eas whoami`.

## 3. Configure the project

Run `eas build:configure` to configure your iOS and Android projects to run on EAS Build.

If you have released your app previously and have existing [app signing credentials](/distribution/app-signing.md) that you would like to use, [refer to this guide](/app-signing/existing-credentials.md) for more information on how to configure them.

Additional configuration may be required for some scenarios:

- Is your project inside of a monorepo? [Follow these instructions](how-tos.md#how-to-set-up-eas-build-with).
- Do you use a private npm registry? [Add your npm token](how-tos.md#how-to-use-private-package-repositories).

## 4. Run a build

- Run `eas build --platform android` to build for Android.

- Run `eas build --platform ios` to build for iOS.

When you first run the build, you will be guided through generating or supplying your app signing credentials.

- **Android**: If you have not yet generated a keystore for your app, you can let Expo take care of that for you. If you have already built your app in the managed workflow with `expo build:android`, then the same credentials will be used here. If you would rather manually generate your keystore, please see the advanced [Android Credentials](advanced-credentials-configuration.md#android-credentials) section for more information.

- **iOS**: This requires access to a **paid** [Apple Developer Account](https://developer.apple.com/programs) to configure the credentials required for signing your app. Expo will take care of acquiring the credentials for you, and if you have already built your app in the managed workflow with `expo build:ios`, then the same credentials will be used here. If you would rather manually provide your credentials, refer to the advanced [iOS Credentials](advanced-credentials-configuration.md#ios-credentials) section for more information.

> 💡 You can run `eas build --platform all` to build for Android and iOS at the same time.

## 5. Wait for the build to complete

By default, the `eas build` command will wait for your build to complete. However, if you interrupt this command and monitor the progress of your builds by either visiting [the EAS Build dashboard](https://expo.io/builds?type=eas) or running the `eas build:show` command.

## 6. Next steps

### Distribute your app

- Want to distribute your apps to internal testers? [Learn about internal distribution](internal-distribution.md).
- Ship your app! [Learn how to submit your app to app stores with EAS Submit](/submit/introduction.md).
  <!-- - Add new build profiles, such as simulator builds or build specific for certain release environments. -->

### Get a deeper understanding

- Read the [Configuration with eas.json](eas-json.md) guide to get familiar with EAS Build configuration options.
- If you want to learn more about the internals of Android and iOS builds, check out our [Android build process](android-builds.md) and [iOS build process](ios-builds.md) pages.
- Lastly, if you feel like an expert on credentials configuration, see the [Advanced credentials configuration](advanced-credentials-configuration.md) guide to customize the build process even further.
- Other than that, stay tuned - more features are coming to EAS Build soon!
