---
title: Uploading Apps to the Apple App Store and Google Play
---

**Disclaimer:** This feature works properly only on macOS.

This guide will help you upload your Expo standalone apps to Apple TestFlight and to Google Play.
You'll need a paid developer account for each platform for which you wish to upload and publish an app. You can create an Apple Developer account on [Apple's developer site](https://developer.apple.com/account/) and a Google Play Developer account on the [Google Play Console sign-up page](https://play.google.com/apps/publish/signup/).

## 1. Build a standalone app

To learn how to build native binaries, see [Building Standalone Apps](../building-standalone-apps/) or [Building Standalone Apps on Your CI](../turtle-cli).

## 2. Start the upload

To upload the previously built standalone app to the appropriate app store, you simply run `expo upload:android` or `expo upload:ios`. However, you have a few options for choosing which app binary you want to upload (remember to choose one at the time):

- `--latest` - chosen by default, uploads the latest build for the given platform found on the Expo servers
- `--id <id>` - uploads a build with the given ID
- `--path <path>` - uploads a build from the local file system

## 2.1. If you choose to upload your Android app to Google Play

**Important:** You have to create a Google Service Account and download its JSON private key. After that, you'll have to create an app on the [Google Play Console](https://play.google.com/apps/publish/) and upload your app manually at least once.

#### Creating a Google Service Account

1. Open the [Google Play Console](https://play.google.com/apps/publish/).
2. Click the **Settings** menu entry, followed by **API access**.
3. Click the **CREATE SERVICE ACCOUNT** button. If you see a message saying API access is not enabled for your account, you must first link your Google Play developer account with a Google Developer Project. On this page, either link it to an existing project if you have one, or click **CREATE NEW PROJECT** to link with a new one.
4. Follow the **Google API Console** link in the dialog
    1. Click the **CREATE SERVICE ACCOUNT** button
    2. Enter the name of this service account in the field titled "Service account name". We recommend a name that will make it easy for you to remember that it is for your Google Play Console account. Also, enter the service account ID and description of your choice.
    3. Click **Select a role** and choose **Service Accounts > ServiceAccount User**
    4. Check the **Furnish a new private key** checkbox
    5. Make sure the "Key type" field is set to **JSON**
    6. Click **SAVE** to close the dialog
    7. Make a note of the filename of the JSON file downloaded to your computer. You'll need this to upload your app later. Be sure to keep this JSON file secure, as it provides API access to your Google Play developer account.
5. Return to the **API access** page on the **Google Play Console** and ensure it shows your new service account.
6. Click on **Grant Access** for the newly added service account
7. Choose **Release Manager** from the newly added service account
8. Click **ADD USER** to close the dialog

#### Manually uploading your app for the first time

Before using `expo-cli` for uploading your standalone app builds, you have to upload your app manually at least once. [See here for the instructions on how to do it.](https://support.google.com/googleplay/android-developer/answer/113469)

#### Using expo-cli to upload the further builds of your app

After these steps, you can make use of `expo-cli` to upload your further app builds to Google Play.

To upload your Android app to Google Play, run `expo upload:android`. You can set following options when uploading an Android standalone app:
- `--key <key>` **(required)** - path to the JSON key used to authenticate with the Google Play Store (created in the previous steps)
- `--track <track>` - the track of the application to use, choose from: production, beta, alpha, internal, rollout (default: internal)

## 2.2. If you choose to upload your iOS app to TestFlight

### Using expo-cli

To upload your iOS app to TestFlight, run `expo upload:ios`. You can set following options when uploading an iOS standalone app:
- `--apple-id <apple-id>` **(required)** - your Apple ID login. Alternatively you can set the `EXPO_APPLE_ID` environment variable.
- `--apple-id-password <apple-id-password>` **(required)** - your Apple ID password. Alternatively you can set the `EXPO_APPLE_ID_PASSWORD` environment variable.
- `--app-name <app-name>` - your app display name, will be used to name an app on App Store Connect
- `--sku <sku>` - a unique ID for your app that is not visible on the App Store, will be generated unless provided
- `--language <language>` - primary language (e.g. English, German; run `expo upload:ios --help` to see the list of available languages) (default: English)

### Manually uploading your app

In order to see your app on Testflight, you will first need to submit your .IPA file to Apple using **Transporter** (previously known as Application Loader), available on the App Store ([link](https://apps.apple.com/app/transporter/id1450874784)). In order to do this:

1. Make sure you have logged into iTunes connect at least once with your Apple ID and accepted the terms.
2. Download Transporter from the [App Store](https://apps.apple.com/app/transporter/id1450874784).
3. Sign in with your Apple ID.
4. Add the IPA either by dragging it onto the Transporter window or by selecting it from the file dialog opened with **+** or **Add App** button.
5. Submit the IPA by clicking the **Deliver** button.

This process can take a few minutes. After this process is complete, you can check the status of your app submission to TestFlight in [App Store Connect](https://appstoreconnect.apple.com):

1. Login to https://appstoreconnect.apple.com with your Apple ID and regular password (NOT your app specific password)
2. Select 'My Apps' and you should see your app listed.
3. Click 'TestFlight' from the menu bar at the top.
4. This will show your current app builds that are available for testing.
5. In order to test the app on your device, you will need to install the TestFlight iOS app from the App Store, and sign in using your Apple ID.
