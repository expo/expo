---
title: Submit to the Apple App Store
sidebar_title: Submit to Apple App Store
---

This guide outlines how to submit your app to the Apple App Store from your own computer and from CI.

## Prerequisites

A paid developer account is required to submit an app &mdash; you can create an Apple Developer account on the [Apple Developer Portal](https://developer.apple.com/account/).

## 1. Build a standalone app

You'll need a built native app binary. You can either use the [EAS Build](introduction.md) service or do it on your own.

## 2. Start the submission

To submit the binary to the App Store, run `eas submit -p ios` from inside of your project directory. The command will lead you step by step through the process of submitting the app. To see all possible options along with example usages, run `eas submit --help`.

> Although it's possible to upload any binary to the store, each submission is assigned to an Expo project. That's why it's important to start submission from inside your project's directory - that's where your [app configuration](../workflow/configuration.md) is defined.

**Important**: You'll have to generate an [Apple app-specific-password](https://expo.fyi/apple-app-specific-password) before uploading an app using EAS CLI.

To upload your iOS app to the Apple App Store, run `eas submit --platform ios` and follow the instructions on the screen. The command will perform the following steps:

1. Log in to Expo account and ensure that your app project exists on EAS servers
2. Ensure that your app exists on App Store Connect and its [Bundle Identifier](https://expo.fyi/bundle-identifier) is registered on Apple Developer Portal:

   - You will be asked to sign into your Apple Developer account and select your team. You can also provide this information by using the `--apple-id`, `--apple-team-id` params and the `EXPO_APPLE_PASSWORD` environment variable.
   - The command will look for `ios.bundleIdentifier` in your app configuration, or you can provide it directly using the `--bundle-identifier` flag.
   - If you are submitting your app for the first time, it will be automatically created.
     Unless `expo.name` in your app configuration is found or an `--app-name` param is provided, you will be prompted for app name.
     You can also specify your app's language and SKU using `--language` and `--sku` params respectively. If you have never submitted any app before, you may also have to specify your company name using `--company-name` parameter.

   > If you already have an App Store Connect app, this step can be skipped by providing the `--app-asc-id` param. The [ASC App Id](https://expo.fyi/asc-app-id) param can be found either on App Store Connect, or later during this command in the _Submission Summary_ table.

3. Ask for your Apple ID (if not provided earlier) and for your Apple app-specific password. They can be also provided using `--apple-id` param and `EXPO_APPLE_APP_SPECIFIC_PASSWORD` environment variable, respectively.
4. Ask for binary to submit. You can select one of the following:

   - The latest successful iOS build for the project on EAS servers
   - Specific build ID. The ID can be found on the [builds dashboard](https://expo.io/builds?type=eas)
   - Path to an `.ipa` archive on your local filesystem
   - URL to the app archive

   > This step can be skipped, if one of the following parameters is provided: `--latest`, `--id`, `--path` or `--url`.

5. A summary of the provided configuration is displayed and the submission process begins. The submission progress is displayed on the screen.
6. Your build should now be visible on [App Store Connect](https://appstoreconnect.apple.com). If something goes wrong, an appropriate message is displayed on the screen.

## Submitting your app using CI

The `eas submit` command is able to perform submissions from a CI environment. All you have to do is ensure that all required information is provided with command parameters and environment variables. Mainly, providing the archive source (`--latest`, `--id`, `--path` or `--url`) is essential. Also, make sure that the iOS Bundle Identifier is present in your [app configuration file](/workflow/configuration.md), unless you provide the `--bundle-identifier` flag.

For iOS submissions you have to provide `EXPO_APPLE_APP_SPECIFIC_PASSWORD` environment variable along with Apple ID (`--apple-id`) and ASC App ID (`--asc-app-id`) parameters. The `--asc-app-id` is required to skip Apple developer login with potential prompt for 2FA authentication.

Example usage:

```sh
EXPO_APPLE_APP_SPECIFIC_PASSWORD=xxxxx eas submit -p ios --latest --apple-id=user@example.com --asc-app-id=1234567890
```