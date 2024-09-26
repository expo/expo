---
title: Submit to the Google Play Store
sidebar_title: Submit to Google
description: Learn how to submit your app to the Google Play Store from your computer and CI.
---

import { Terminal } from '~/ui/components/Snippet';
import { Step } from '~/ui/components/Step';

This guide outlines how to submit your app to the Google Play Store from your own computer and from CI.

## Prerequisites

- A paid developer account is required &mdash; You can create a Google Play Developer account on the [Google Play Console sign-up page](https://play.google.com/apps/publish/signup/).
- You have to create a [Google Service Account](https://expo.fyi/creating-google-service-account) and download its JSON private key.
- After that, you'll have to create an app on [Google Play Console](https://play.google.com/apps/publish/) and upload your app manually at least once.
- You will also need to have EAS CLI installed and authenticated with your Expo account:
  <Terminal cmd={['$ npm install -g eas-cli && eas login']} />

### Creating a Google Service Account

For more information, see [expo.fyi/creating-google-service-account](https://expo.fyi/creating-google-service-account).

### Manually uploading your app for the first time

Before using `eas submit -p android` for uploading your builds, you have to upload your app manually at least once. This is a limitation of the Google Play Store API.

For more information, see [expo.fyi/first-android-submission](https://expo.fyi/first-android-submission).

<Step label="1">

## Build a standalone app

You'll need a native app binary signed for store submission. You can either use [EAS Build](/build/introduction/) or do it on your own.

</Step>

<Step label="2">
## Start the submission

To submit the binary to the Play Store, run `eas submit -p android` from inside your project directory. The command will lead you step by step through the process of submitting the app. See the [Configuration with eas.json](/build/eas-json/) page to learn how to pre-configure your submission.

> Although it's possible to upload any binary to the store, each submission is associated with an Expo project. That's why it's important to start a submission from inside your project's directory because [app config](/workflow/configuration) is defined inside that directory.

To upload your Android app to the Google Play Store, run `eas submit --platform android` and follow the instructions on the screen.

The command will perform the following steps:

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

</Step>

## Submitting your app using CI

The `eas submit` command can perform submissions from a CI environment. All you have to do is ensure that all required information is provided with **eas.json** and environment variables. Mainly, providing the archive source (`--latest`, `--id`, `--path`, or `--url`) is essential. Also, make sure that the Android package name is present in your [app config file](/workflow/configuration/).

For Android submissions, you must provide the path to your Google Services JSON key using the `serviceAccountKeyPath` key in **eas.json**. You may also find the `track` and `releaseStatus` parameters useful.

Example usage:

<Terminal cmd={['$ eas submit -p android --profile foobar']} />

## Automating submissions

To learn how to automatically submit your app after a successful build, refer to the [Automating submissions](/build/automate-submissions).
