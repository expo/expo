---
title: Building Standalone Apps
---

Not everybody wants to tell their customers or friends to download Expo to use their app; You want to be able to have the app on its own from the App Store and Play Store. We call these "shell apps" or "standalone apps". The purpose of this guide is to walk you through creating a standalone version of your Expo app for iOS and Android.

An Apple Developer account is needed to build the iOS standalone app, but a Google Play Developer account is not needed to build the Android standalone app. If you'd like to submit to either app store, you will of course need a developer account on that store.

> **Warning:** Standalone apps are currently in beta! While the Android version has been heavily tested with [li.st](https://li.st/), the iOS version and our automated build pipeline for both are brand new so you may run into some issues. Be sure to reach out to us on Slack or Twitter if you do and we'll put them on our roadmap, much appreciated!

## 1. Install exp

XDE currently doesn't include an option for building a standalone app, so we'll need `exp` for this. Run `npm install -g exp` to get it.

If you haven't used `exp` before, the first thing you'll need to do is login with your Expo account using `exp login`.

## 2. Configure app.json

```javascript
 {
   "expo": {
    "name": "Your App Name",
    "icon": "./path/to/your/app-icon.png",
    "version": "1.0.0",
    "slug": "your-app-slug",
    "sdkVersion": "17.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourappname"
    },
    "android": {
      "package": "com.yourcompany.yourappname"
    }
   }
 }
```

The iOS `bundleIdentifier` and Android `package` fields use reverse DNS notation, but don't have to be related to a domain. Replace `"com.yourcompany.yourappname"` with whatever makes sense for your app.

You're probably not surprised that `name`, `icon` and `version` are required, but if you haven't used Expo much you might be confused by `slug` and `sdkVersion`. `slug` is the url name that your app's JavaScript is published to, for example `exp.host/@community/native-component-list`, where `community` is my username and `native-component-list` is the slug. The `sdkVersion` tells Expo what Expo runtime version to use, which corresponds to a React Native version. Although `"17.0.0"` is listed in the example, you already have an `sdkVersion` in your app.json and should not change it except when you want to update to a new version of Expo.

There are other options you might want to add to `app.json`. We have only covered what is required. For example, some people like to configure their own build number, linking scheme, and more. We highly recommend you read through [Configuration with app.json](configuration.html) for the full spec.

## 3. Start the build

-   Run `exp start` in your app directory to boot up the Expo packager. This is necessary because during the build process your app will be republished to ensure it is the latest version.
-   Once the app has started, run `exp build:android` or `exp build:ios`.

### If you choose to build for Android

The first time you build the project you will be asked whether you'd like to upload a keystore or have us handle it for you. If you don't know what a keystore is, just leave it to us. Otherwise, feel free to upload your own.

```bash
[exp] No currently active or previous builds for this project.

Would you like to upload a keystore or have us generate one for you?
If you don't know what this means, let us handle it! :)

  1) Let Expo handle the process!
  2) I want to upload my own keystore!
```

> **Note:** If you choose the first option and later decide to upload your own keystore, we currently offer an option to clear your current Android keystore from our build servers by running `exp build:android --clear-credentials.` **This is irreversible, so only run this command if you know what you are doing!** You can download a backup copy of the keystore by running `exp fetch:android:keystore`. If you do not have a local copy of your keystore , you will be unable to publish new versions of your app to the Play Store. Your only option would be to generate a new keystore and re-upload your application as a new application. You can learn more about how code signing and keystores work [in the Android documentation](https://developer.android.com/studio/publish/app-signing.html).

### If you choose to build for iOS

The first time you build the project You will be prompted for your Apple ID and password for your developer account, and your Apple Team ID. This is needed to manage certificates and provisioning profiles, so we can build and send off push notifications.

```bash
[exp] No currently active or previous builds for this project.

We need your Apple ID/password to manage certificates and provisioning
profiles from your Apple Developer account.

What's your Apple ID? example@gmail.com
Password? ******************
What is your Apple Team ID (you can find that on this page:
https://developer.apple.com/account/#/membership)? XY1234567
```

> **Note:** We currently don't support Apple's two-factor authentication, so you'll have to temporarily turn off 2FA on your Apple ID account to use exp build. The GitHub issue for 2FA support is [#160](https://github.com/expo/expo/issues/160).

Next we will ask you if you'd like us to handle your distribution certificate or use your own. Similar to the Android keystore, if you don't know what a distribution certificate is, just let us handle it for you. If you do need to upload your own certificates, we recommend following [this excellent guide on making a p12 file](https://calvium.com/how-to-make-a-p12-file/).

## 4. Wait for it to finish building

This will take a few minutes, you can check up on it by running `exp build:status`. When it's done, you'll see the url of a `.apk` (Android) or `.ipa` (iOS) file -- this is your app.

> **Note:** We enable bitcode for iOS, so the `.ipa` files for iOS are much larger than the eventual App Store download available to your users. For more information, see [App Thinning](https://developer.apple.com/library/content/documentation/IDEs/Conceptual/AppDistributionGuide/AppThinning/AppThinning.html).

## 5. Test it on your device or simulator

-   You can drag and drop the `.apk` into your Android emulator. This is the easiest way to test out that the build was successful. But it's not the most satisfying.
-   **To run it on your Android device**, make sure you have the Android platform tools installed along with `adb`, then just run `adb install app-filename.apk` with your device plugged in.
-   **To run it on your iOS device**, you will need to put in a bit more work :( We are working on producing simulator builds to make it easier to test, but for now you will need to use Apple TestFlight. Go to iTunes connect and create a new app and pick your bundle identifier. After that, I recommend using [pilot](https://github.com/fastlane/fastlane/tree/master/pilot) to upload the build and add testers.

## 6. Submit it to the appropriate store

We don't automate this step (yet), but at this point you should be able to follow the Apple and Google documentation to submit your standalone binary to each respective store.

If you plan to submit to the Apple App Store, your app will be subject to normal Apple review guidelines. A plain Expo build will have no issues with this, but your app's particular behavior, content, and metadata are all under your control. Some of these resources are worth reading:

-   [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
-   [App Icon Guidelines](https://developer.apple.com/ios/human-interface-guidelines/graphics/app-icon/)
-   [Common App Rejections](https://developer.apple.com/app-store/review/rejections/)

> **Note:** When submitting to the iTunes Store, you'll be asked whether your app uses the advertising identifier (IDFA). Because Expo depends on Segment Analytics, the answer is yes, and you'll need to check a couple boxes on the Apple submission form. See [Segment's Guide](https://segment.com/docs/sources/mobile/ios/quickstart/#step-5-submitting-to-the-app-store) for which specific boxes to fill in.

## 7. Update your app

For the most part, when you want to update your app, just Publish again from exp or XDE. Your users will get the new JS the next time they open the app. There are only a couple reasons why you might want to rebuild and resubmit the native binaries:

- If you want to change native metadata like the app's name or icon
- If you upgrade to a newer `sdkVersion` of your app (which requires new native code)

To keep track of this, you can also update the binary's [versionCode](configuration.html#versioncode) and [buildNumber](configuration.html#buildnumber). It is a good idea to glance through the [app.json documentation](configuration.html) to get an idea of all the properties you can change, e.g. the icons, deep linking url scheme, handset/tablet support, and a lot more.

If you run into problems during this process, we're more than happy to help out! Join our Slack and let us know if you have any questions.
