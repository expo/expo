---
title: Submit to app stores
description: Learn how to submit your app to Google Play Store and Apple App Store from the command line with EAS Submit.
---

import { AppleAppStoreIcon } from '@expo/styleguide-icons/custom/AppleAppStoreIcon';
import { EasSubmitIcon } from '@expo/styleguide-icons/custom/EasSubmitIcon';
import { GoogleAppStoreIcon } from '@expo/styleguide-icons/custom/GoogleAppStoreIcon';

import { BoxLink } from '~/ui/components/BoxLink';
import { Collapsible } from '~/ui/components/Collapsible';
import { Terminal } from '~/ui/components/Snippet';
import { VideoBoxLink } from '~/ui/components/VideoBoxLink';

**EAS Submit** is a hosted service that allows uploading and submitting app binaries to the app stores using EAS CLI. This guide describes how to submit your app to the Google Play Store and Apple App Store using EAS Submit.

<VideoBoxLink
  videoId="-KZjr576tuE"
  title="How to quickly publish to the App Store & Play Store with EAS Submit"
  description="EAS Submit makes it easy to publish your apps to the App Store and Play Store with a simple command."
/>

## Google Play Store

### Prerequisites

- A paid developer account is required — You can create a Google Play Developer account on the [Google Play Console sign-up page](https://play.google.com/apps/publish/signup/).
- Create a [Google Service Account](https://cloud.google.com/iam/docs/creating-managing-service-accounts) and download its JSON private key.
- Create an app on [Google Play Console](https://play.google.com/apps/publish/) and upload your app manually at least once.
- Native app binary signed for Google Play Store submission using EAS Build. If you haven't followed the previous guide, see [Build your project for app stores](/deploy/build-project/) for more information.

> Although it's possible to upload any binary to the store, each submission is associated with an Expo project. That's why it's important to start a submission from inside your project's directory because [app config](/workflow/configuration) is defined inside that directory.

### Submit binary to Google Play Store

To submit the app binary to Google Play Store, run the following command from inside your project's directory:

<Terminal cmd={['$ eas submit -p android']} />

The command will lead you through the process of submitting the app. It will perform the following steps:

- Log in to your Expo account and ensure that your app project exists on EAS servers.
- Prompt for the Android package name unless `android.package` is set in the app config.
- Ask for which binary to submit. You can select one of the following:

  - The latest finished Android build for the project on EAS servers.
  - Specific build ID. It can be found on the [builds dashboard](https://expo.dev/builds).
  - Path to an **.apk** or **.aab** archive on your local filesystem.
  - URL to the app archive.

  > This step can be skipped if one of the following CLI parameters is provided: `--latest`, `--id`, `--path`, or `--url`.

- Unless `serviceAccountKeyPath` is provided in **eas.json**, you will be prompted for the path to your Google Services JSON key.
- The summary of provided configuration is displayed and the submission process begins. The submission progress is displayed on the screen.
- Your build should now be visible on Google Play Console. If something goes wrong, an appropriate message is displayed on the screen.

## Apple App Store

### Prerequisites

- A paid developer account is required to submit an app &mdash; you can create an Apple Developer account on the [Apple Developer Portal](https://developer.apple.com/account/).
- Native app binary signed for Apple App Store submission using EAS Build. If you haven't followed the previous guide, see [Build your project for app stores](/deploy/build-project/) for more information.

### Submit binary to Apple App Store

> If you have not generated an App Store Connect API Key yet, you can let EAS CLI take care of that for you by signing into your Apple Developer Program account and following the prompts. You can also upload your own [API Key](https://expo.fyi/creating-asc-api-key) or pass in an [Apple app-specific password](https://expo.fyi/apple-app-specific-password).

To submit the binary to the App Store, run the following command from inside your project's directory:

<Terminal cmd={['$ eas submit -p ios']} />

The command will lead you through the process of submitting the app. It will perform the following steps:

- Log in to your Expo account and ensure that your app project exists on EAS servers.
- Ensure that your app exists on App Store Connect and its [Bundle Identifier](https://expo.fyi/bundle-identifier) is registered on Apple Developer Portal:

  - You will be asked to log in to your Apple Developer account and select your team. You can also provide this information in **eas.json** by setting `appleId` and `appleTeamId` in the submit profile. The Apple ID password has to be set with the `EXPO_APPLE_PASSWORD` environment variable.
  - The command will look for `ios.bundleIdentifier` in the app config.
  - If you are submitting your app for the first time, it will be automatically created.
    Unless `expo.name` in your app configuration is found or `appName` is provided in **eas.json**, you will be prompted for the app name.
    You can also specify your app's language and SKU using `language` and `sku` keys in **eas.json**. If you have never submitted any app before, you may also have to specify your company name with `companyName`.

  > If you already have an App Store Connect app, this step can be skipped by providing the `ascAppId` in the submit profile. The [ASC App ID](https://expo.fyi/asc-app-id) can be found either on App Store Connect, or later during this command in the _Submission Summary_ table.

- Ensure you have the proper credentials set up. If none can be found, you can let EAS CLI set some up for you.

  <Collapsible summary="Do you want to use your own credentials?">

  **App Store Connect API Key:** Create your own [API Key](https://expo.fyi/creating-asc-api-key) then set it with the `ascApiKeyPath`, `ascApiKeyIssuerId`, and `ascApiKeyId` fields in **eas.json**.

  **App Specific Password:** Provide your [password](https://expo.fyi/apple-app-specific-password) and Apple ID Username by passing them in with the `EXPO_APPLE_APP_SPECIFIC_PASSWORD` environment variable and `appleId` field in **eas.json**, respectively.

  </Collapsible>

- Ask for which binary to submit. You can select one of the following:

  - The latest successful iOS build for the project on EAS servers.
  - Specific build ID. It can be found on the [builds dashboard](https://expo.dev/builds).
  - Path to an **.ipa** archive on your local filesystem.
  - URL to the app archive.

  > This step can be skipped if one of the following CLI parameters is provided: `--latest`, `--id`, `--path`, or `--url`.

- A summary of the provided configuration is displayed and the submission process begins. The submission progress is displayed on the screen.
- Your build should now be visible on [App Store Connect](https://appstoreconnect.apple.com). If something goes wrong, an appropriate message is displayed on the screen.

## Manual submission to app stores

To learn more about manual app submission process to Google Play Store and Apple App Store, see the following:

<BoxLink
  title="Manual first submission of an Android app"
  description="Follow the steps from the FYI guide on manually submitting your app to Google Play Store for the first time."
  href="https://expo.fyi/first-android-submission"
  Icon={GoogleAppStoreIcon}
/>

<BoxLink
  title="App submission using App Store Connect"
  description="Learn how to submit your app manually to Apple App Store or TestFlight using App Store Connect."
  href="/guides/local-app-production/#app-submission-using-app-store-connect"
  Icon={AppleAppStoreIcon}
/>

## Next step

<BoxLink
  title="EAS Submit configuration with eas.json"
  description="Learn how to pre-configure your project using eas.json file with EAS Submit and more about Android or iOS specific options."
  Icon={EasSubmitIcon}
  href="/submit/eas-json/"
/>
