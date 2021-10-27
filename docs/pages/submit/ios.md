---
title: Submitting to the Apple App Store
sidebar_title: Submitting to Apple
---

This guide outlines how to submit your app to the Apple App Store from your own computer and from CI.

## Prerequisites

- A paid developer account is required to submit an app &mdash; you can create an Apple Developer account on the [Apple Developer Portal](https://developer.apple.com/account/).
- You will also need to have EAS CLI installed and authenticated with your Expo account: `npm install -g eas-cli && eas login`.

## 1. Build a standalone app

You'll need a native app binary signed for store submission. You can either use [EAS Build](introduction.md) or do it on your own.

## 2. Start the submission

To submit the binary to the App Store, run `eas submit -p ios` from inside your project directory. The command will lead you step by step through the process of submitting the app. See the [Configuration with eas.json](./eas-json.md) page to learn how to pre-configure your submission.

> Although it's possible to upload any binary to the store, each submission is associated with an Expo project. That's why it's important to start a submission from inside your project's directory - that's where your [app configuration](../workflow/configuration.md) is defined.

**Important**: You'll have to generate an [Apple app-specific password](https://expo.fyi/apple-app-specific-password) or an [App Store Connect Api Key](https://expo.fyi/creating-asc-api-key) before submitting an app with EAS CLI.

To upload your iOS app to the Apple App Store, run `eas submit --platform ios` and follow the instructions on the screen.

The command will perform the following steps:

- Log in to your Expo account and ensure that your app project exists on EAS servers.
- Ensure that your app exists on App Store Connect and its [Bundle Identifier](https://expo.fyi/bundle-identifier) is registered on Apple Developer Portal:

  - You will be asked to log in to your Apple Developer account and select your team. You can also provide this information in **eas.json** by setting `appleId` and `appleTeamId` in the submit profile. The Apple ID password has to be set with the `EXPO_APPLE_PASSWORD` environment variable.
  - The command will look for `ios.bundleIdentifier` in the app config.
  - If you are submitting your app for the first time, it will be automatically created.
    Unless `expo.name` in your app configuration is found or `appName` is provided in **eas.json**, you will be prompted for the app name.
    You can also specify your app's language and SKU using `language` and `sku` keys in **eas.json**. If you have never submitted any app before, you may also have to specify your company name with `companyName`.

  > If you already have an App Store Connect app, this step can be skipped by providing the `ascAppId` in the submit profile. The [ASC App ID](https://expo.fyi/asc-app-id) can be found either on App Store Connect, or later during this command in the _Submission Summary_ table.

- Ask for your Apple ID (if not provided earlier) and for your Apple app-specific password. They can be also provided using `--apple-id` param and `EXPO_APPLE_APP_SPECIFIC_PASSWORD` environment variable, respectively. Alternatively, you can provide an App Store Connect Api Key instead, setting the `ascApiKeyPath`, `ascApiKeyIssuerId`, and `ascApiKeyId` fields in **eas.json**.
- Ask for which binary to submit. You can select one of the following:

  - The latest successful iOS build for the project on EAS servers.
  - Specific build ID. It can be found on the [builds dashboard](https://expo.dev/builds).
  - Path to an **.ipa** archive on your local filesystem.
  - URL to the app archive.

  > This step can be skipped if one of the following parameters is provided: `--latest`, `--id`, `--path`, or `--url`.

- A summary of the provided configuration is displayed and the submission process begins. The submission progress is displayed on the screen.
- Your build should now be visible on [App Store Connect](https://appstoreconnect.apple.com). If something goes wrong, an appropriate message is displayed on the screen.

## Submitting your app using CI

The `eas submit` command is able to perform submissions from a CI environment. All you have to do is ensure that all required information is provided with **eas.json** and environment variables. Mainly, providing the archive source (`--latest`, `--id`, `--path`, or `--url`) is essential. Also, make sure that the iOS Bundle Identifier is present in your [app config file](/workflow/configuration.md).

For iOS submissions, you must provide either:

- `EXPO_APPLE_APP_SPECIFIC_PASSWORD` environment variable along with Apple ID and ASC App ID (`appleId` and `ascAppId` in **eas.json**). The ASC App ID is required to skip the Apple developer log-in process, which will likely not be possible on CI due to the 2FA prompt.
- Your App Store Connect Api Key with the `ascApiKeyPath`, `ascApiKeyIssuerId`, and `ascApiKeyId` fields set in **eas.json**.

Example usage:

```sh
EXPO_APPLE_APP_SPECIFIC_PASSWORD=xxxxx eas submit -p ios --latest --profile foobar
```
