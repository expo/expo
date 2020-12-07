---
title: Set up your project and environment
---

Follow these instructions to integrate EAS Build in your existing project.

## 1. Install the latest EAS CLI

Install EAS CLI by running `npm install -g eas-cli` (or `yarn global add eas-cli`). If you already have it, make sure you're using the latest version. EAS Build is in beta and it's changing rapidly, so the only way to ensure that you will have the best experience is to use the latest eas-cli version.

## 2. Log in to your Expo account

Log in with `eas login`, or [sign up](https://expo.io/signup) if you don't have an account yet. You can check if you're logged in by running `eas whoami`.

## 3. Set application identifiers

These will be used to identify your application on the Apple App Store and Google Play.

- **Android**: Set `expo.android.package` in your [app.json/app.config.js](/workflow/configuration.md).
- **iOS**: Set `expo.ios.bundleIdentifier` in your [app.json/app.config.js](/workflow/configuration.md).

Learn more about application identifiers in the [Walkthrough](walkthrough.md#set-application-identifiers).

## 4. Configure the project

Run `eas build:configure` to configure your iOS and Android projects to run on EAS Build. This will only take a few seconds, it's automated.

Additional configuration may be required for some scenarios:

- Is your project inside of a monorepo? [Follow these instructions](how-tos.md#how-to-set-up-eas-build-with).
- Do you use a private npm registry? [Add your npm token](how-tos.md#how-to-use-private-package-repositories).

## 5. Run a build

- Run `eas build --platform android` to build for Android.

- Run `eas build --platform ios` to build for iOS.

When you first run the build, you will be guided through generating or supplying your app signing credentials.

- **Android**: If you have not yet generated a keystore for your app, you can let Expo take care of that for you. If you have already built your app in the managed workflow with `expo build:android`, then the same credentials will be used here. If you would rather manually generate your keystore, please see the advanced [Android Credentials](advanced-credentials-configuration.md#android-credentials) section for more information.

- **iOS**: This requires access to a **paid** [Apple Developer Account](https://developer.apple.com/programs) to configure the credentials required for signing your app. Expo will take care of acquiring the credentials for you, and if you have already built your app in the managed workflow with `expo build:ios`, then the same credentials will be used here. If you would rather manually provide your credentials, refer to the advanced [iOS Credentials](advanced-credentials-configuration.md#ios-credentials) section for more information.

> 💡 You can run `eas build --platform all` to build for Android and iOS at the same time.

## 6. Wait for the build to complete

By default, the `eas build` command will wait for your build to complete. However, if you interrupt this command and monitor the progress of your builds by either visiting [the EAS Build dashboard](https://expo.io/builds?type=eas) or running the `eas build:show` command.

## 7. Next steps

### Distribute your app

- Want to distribute your apps to internal testers? [Learn about internal distribution](internal-distribution.md).
- Ship your app! [Learn how to submit your app to app stores with EAS Submit](/submit/introduction.md).
<!-- - Add new build profiles, such as simulator builds or build specific for certain release environments. -->

### Get a deeper understanding

- Read the [Configuration with eas.json](eas-json.md) guide to get familiar with EAS Build configuration options.
- If you want to learn more about the internals of Android and iOS builds, check out our [Android build process](android-builds.md) and [iOS build process](ios-builds.md) pages.
- Lastly, if you feel like an expert on credentials configuration, see the [Advanced credentials configuration](advanced-credentials-configuration.md) guide to customize the build process even further.
- Other than that, stay tuned - more features are coming to EAS Build soon!
