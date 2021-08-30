---
title: Submitting to the Google Play Store
sidebar_title: Submitting to Google
---

This guide outlines how to submit your app to the Google Play Store from your own computer and from CI.

## Prerequisites

- A paid developer account is required &mdash; You can create a Google Play Developer account on the [Google Play Console sign-up page](https://play.google.com/apps/publish/signup/).
- You have to create a [Google Service Account](https://cloud.google.com/iam/docs/creating-managing-service-accounts) and download its JSON private key.
- After that, you'll have to create an app on [Google Play Console](https://play.google.com/apps/publish/) and upload your app manually at least once.

### Creating a Google Service Account

See [expo.fyi/creating-google-service-account](https://expo.fyi/creating-google-service-account) to learn more.

### Manually uploading your app for the first time

Before using `eas submit -p android` for uploading your builds, you have to upload your app manually at least once. This is a limitation of the Google Play Store API.

See [expo.fyi/first-android-submission](https://expo.fyi/first-android-submission) to learn more.

## 1. Build a standalone app

You'll need a built native app binary. You can either use the [EAS Build](introduction.md) service or do it on your own.

## 2. Start the submission

To submit the binary to the Play Store, run `eas submit -p android` from inside your project directory. The command will lead you step by step through the process of submitting the app. To see all possible options along with example usages, run `eas submit --help`.

> Although it's possible to upload any binary to the store, each submission is assigned to an Expo project. That's why it's important to start submission from inside your project's directory - that's where your [app configuration](../workflow/configuration.md) is defined.

To upload your Android app to the Google Play Store, run `eas submit --platform android` and follow the instructions on the screen.

The command will perform the following steps:

- Log in to your Expo account and ensure that your app project exists on EAS servers.
- Prompt for the Android package name unless `android.package` is set in app configuration or the `--android-package` param is provided.
- Ask for which binary to submit. You can select one of the following:

   - The latest finished Android build for the project on EAS servers
   - Specific build ID. The ID can be found on the [builds dashboard](https://expo.dev/builds?type=eas)
   - Path to an APK or AAB archive on your local filesystem
   - URL to the app archive

   > This step can be skipped if one of the following parameters is provided: `--latest`, `--id`, `--path` or `--url`.

- When you chose local path or URL as your binary location, the command will try to autodetect the archive type based on the file extension. If it's unable to do so, it may prompt you to specify whether it's an APK or AAB archive. You can also use a `--type` parameter.
- Unless a `--key` param is provided, you will be prompted for the path to your Google Services JSON key.
- The summary of provided configuration is displayed and the submission process begins. The submission progress is displayed on the screen.
- Your build should now be visible on Google Play Console. If something goes wrong, an appropriate message is displayed on the screen.

## Submitting your app using CI

The `eas submit` command is able to perform submissions from a CI environment. All you have to do is ensure that all required information is provided with command parameters and environment variables. Mainly, providing the archive source (`--latest`, `--id`, `--path` or `--url`) is essential. Also, make sure that Android package name is present in your app configuration file, unless you provide the `--android-package` flag.

For Android submissions, you must provide the path to your Google Services JSON key using the `--key` parameter. If you're not using EAS Builds for building your binary, consider specifying `--type=(APK|AAB)` explicitly. You may also find the `--track` and `--release-status` parameters useful.

Example usage:

```sh
eas submit -p android --latest --key=/path/to/google-services.json
```
