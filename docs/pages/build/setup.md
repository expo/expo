---
title: Creating your first build
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight'
import { Collapsible } from '~/ui/components/Collapsible';

In this guide, you'll learn how to build a ready-to-submit binary for the Apple App Store and Google Play Store using EAS Build.

Alternatively, if you prefer to install the app directly to your Android device / emulator or install it in the iOS simulator, we'll point you towards resources that explain how to do that.

For a small app, you should expect to have kicked off your builds for Android and iOS within a few minutes. If you encounter any issues along the way, you can reach out on the [Expo forums](https://forums.expo.dev/) or [Discord](https://chat.expo.dev/).

## Prerequisites

EAS Build is a new and rapidly evolving service; before you set out to create a build for your project we recommend consulting the [limitations](/build-reference/limitations.md) page and the other prerequisites below.

<Collapsible summary="📦 A React Native iOS and/or Android project that you want to build">

Don't have a project yet? No problem: it's quick and easy to create a "Hello world" app that you can use with this guide.

- Install Expo CLI by running `npm install -g expo-cli`.
- Run `expo init PROJECT_NAME`. Choose the project template that best suits you.
- EAS Build also works well with projects created by `npx create-react-native-app`, `npx react-native`, `ignite-cli`, and other project bootstrapping tools.

<ImageSpotlight alt="Terminal running expo init, with minimal (TypeScript) selected" src="/static/images/eas-build/expo-init.png" />

</Collapsible>

<Collapsible summary="🙋 An Expo user account">

EAS Build is available to everybody with an Expo account; you can sign up at [https://expo.dev/signup](https://expo.dev/signup). You can use EAS Build for free, and paid subscriptions provide service quality improvements such as additional build concurrencies, priority access to minimize time your builds spend queueing, and increased limits on build timeouts. [Read more](https://expo.dev/pricing).

</Collapsible>

## 1. Install the latest EAS CLI

EAS CLI is the program that you will use to interact with EAS services from your terminal. Install EAS CLI by running `npm install -g eas-cli`. It will notify you when a new version is available (we encourage you to always stay up to date with the latest version).

> We recommend using `npm` instead of `yarn` for global package installations. You may alternatively use `npx eas-cli`, just remember to use that instead of `eas` whenever it's called for in the documentation.

## 2. Log in to your Expo account

If you are already signed in through Expo CLI, you don't need to do anything. Otherwise, log in with `eas login`. You can check whether you're logged in by running `eas whoami`.

## 3. Configure the project

Run `eas build:configure` to configure your iOS and Android projects to run on EAS Build. If you'd like to learn more about what happens behind the scenes, you can read the [build configuration process reference](/build-reference/build-configuration.md).

Additional configuration may be required for some scenarios:

- Are you migrating an Expo managed app from `"expo build"`? [Learn about the differences](/build-reference/migrating.md).
- Does your app code depend on environment variables? [Add them to your build configuration](/build-reference/variables.md).
- Is your project inside of a monorepo? [Follow these instructions](/build-reference/how-tos.md#how-to-set-up-eas-build-with).
- Do you use private npm packages? [Add your npm token](/build-reference/private-npm-packages).
- Does your app depend on specific versions of tools like Node, Yarn, npm, Cocoapods, or Xcode? [Specify these versions in your build configuration](/build/eas-json.md).

## 4. Run a build

### Build for Android device/emulator or iOS simulator

The easiest way to try out EAS Build is to create a build that you can run on your Android device/emulator or iOS simulator. It's quicker than uploading it to a store, and you don't need any store developer membership accounts. If you'd like to try this, read about [creating an installable APK for Android](/build-reference/apk.md) and [creating a simulator build for iOS](/build-reference/simulators.md).

### Build for app stores


<Collapsible summary="🍎 Apple Developer Program membership is required to build for the App Store.">

- If you are going to use EAS Build to create release builds for the Apple App Store, this requires access to an account with a $99 USD [Apple Developer Program](https://developer.apple.com/programs) membership.

</Collapsible>

<Collapsible summary="🤖 Google Play Developer membership is required to distribute to the Play Store.">

- You can build and sign your app using EAS Build, but you can't upload it to the Google Play Store unless you have a membership, a one-time $25 USD fee.

</Collapsible>

- Run `eas build --platform android` to build for Android.

- Run `eas build --platform ios` to build for iOS.

- Alternatively, you can run `eas build --platform all` to build for Android and iOS at the same time.

Before the build can start, we'll need to generate or provide app signing credentials. If you have no experience with this, don't worry &mdash; no knowledge is required, you will be guided through the process and EAS CLI will do the heavy lifting.

> If you have released your app to stores previously and have existing [app signing credentials](/distribution/app-signing.md) that you would like to use, [follow these instructions to configure them](/app-signing/existing-credentials.md).

#### Android app signing credentials

- If you have not yet generated a keystore for your app, you can let EAS CLI take care of that for you by selecting `Generate new keystore`, and then you're done. The keystore will be stored securely on EAS servers.
- If you have previously built your app with `expo build:android`, then the same credentials will be used here.
- If you would rather manually generate your keystore, please see the [manual Android credentials guide](/app-signing/local-credentials.md#android-credentials) for more information.

#### iOS app signing credentials

- If you have not generated a provisioning profile and/or distribution certificate yet, you can let EAS CLI take care of that for you by signing into your Apple Developer Program account and following the prompts.
- If you have already built your app with `expo build:ios`, then the same credentials will be used here.
- If you would rather manually generate your credentials, refer to the [manual iOS credentials guide](/app-signing/local-credentials.md#ios-credentials) for more information.

## 5. Wait for the build to complete

By default, the `eas build` command will wait for your build to complete; but, you can interrupt it if you prefer not to wait. Monitor the progress and read the logs by following the link to the build details page. You can also find this page by visiting [your build dashboard](https://expo.dev/builds) or running the `eas build:list` command. If your build is on behalf of an organization that you are a member of, you will find the build details on [the build dashboard for that account](https://expo.dev/accounts/[account]/builds).

> **Did your build fail?** Double check that you followed any applicable instructions in the [configuration step](#3-configure-the-project) and refer to the [troubleshooting guide](/build-reference/troubleshooting.md) if needed.

## 6. Deploy the build

If you have made it to this step, congratulations! Depending on which path you chose, you now either have a build that is ready to upload to an app store, or you have a build that you can install directly on an Android device / iOS simulator.

### Distribute your app to an app store

You will only be able to submit to an app store if you built specifically for this purpose. If you created a build for a store, [learn how to submit your app to app stores with EAS Submit](/submit/introduction.md).

### Install and run the app

You will only be able to install the app directly to your Android device / iOS simulator if you explicitly built it for purpose; if you built for app store distribution, you will need to upload to an app store and then install it from there (for example, from Apple's TestFlight app).

To learn how to install the app directly to your Android device / iOS simulator, navigate to your build details page from [your build dashboard](https://expo.dev/accounts/[account]/builds) and click the "Install" button.

## Next steps

In this guide we walked through the steps for creating your first build with EAS Build, without going into too much depth on any particular part of the process.

When you are ready to learn more, we recommend proceeding through the "Start Building" section of this documentation to learn about topics like [configuration with eas.json](/build/eas-json.md), [internal distribution](/build/internal-distribution.md), [updates](/build/updates.md), [automating submissions](/build/automating-submissions.md), and [triggering builds from CI](/build/building-on-ci.md).

You may also want to dig through the reference section to learn more about the topics that interest you most, such as [build webhooks](/eas/webhooks.md), [build server infrastructure](/build-reference/infrastructure.md), and how the [Android](/build-reference/android-builds.md) and [iOS](/build-reference/ios-builds.md) build processes work. Enjoy!
