---
title: Building Standalone Apps
---

The purpose of this guide is to help you create standalone binaries of your Expo app for iOS and
Android which can be submitted to the Apple App Store and Google Play Store.

An Apple Developer account is needed to build an iOS standalone app, but a Google Play Developer
account is not needed to build the Android standalone app. If you'd like to submit to either app
store, you will need a developer account on that store.

It's a good idea to read the best practices about [Deploying to App Stores](../app-stores/) to
ensure your app is in good shape to get accepted into the Apple and Google marketplaces. We can
generate builds for you, but it's up to you to make your app awesome.

## 1. Install exp

XDE currently doesn't include an option for building a standalone app, so we'll need `exp` for
this. Run `npm install -g exp` to get it.

If you haven't used `exp` before, the first thing you'll need to do is login with your Expo account
using `exp login`.

**Windows users** must have WSL enabled. We recommend picking Ubuntu from the Windows Store. Be sure
to Launch Ubuntu at least once. After that, use an Admin powershell to run:
`Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux`

## 2. Configure app.json

```javascript
 {
   "expo": {
    "name": "Your App Name",
    "icon": "./path/to/your/app-icon.png",
    "version": "1.0.0",
    "slug": "your-app-slug",
    "sdkVersion": "XX.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourappname"
    },
    "android": {
      "package": "com.yourcompany.yourappname"
    }
   }
 }
```

* The iOS `bundleIdentifier` and Android `package` fields use reverse DNS notation, but don't have to be related to a domain. Replace `"com.yourcompany.yourappname"` with whatever makes sense for your app.
* You're probably not surprised that `name`, `icon` and `version` are required.
* `slug` is the url name that your app's JavaScript is published to. For example: `expo.io/@community/native-component-list`, where `community` is my username and `native-component-list` is the slug.
* The `sdkVersion` tells Expo what Expo runtime version to use, which corresponds to a React Native version. Although `"XX.0.0"` is listed in the example, you already have an `sdkVersion` in your app.json and should not change it except when you want to update to a new version of Expo.

There are other options you might want to add to `app.json`. We have only covered what is
required. For example, some people like to configure their own build number, linking scheme, and
more. We highly recommend you read through [Configuration with app.json](../configuration/) for the
full spec. This is also your last chance to double check our [recommendations](../app-stores/)
for App Store metadata.

## 3. Start the build

Run `exp build:android` or `exp build:ios`. If you don't already have a packager running for this
project, `exp` will start one for you.

### If you choose to build for Android

The first time you build the project you will be asked whether you'd like to upload a keystore or
have us handle it for you. If you don't know what a keystore is, just leave it to us. Otherwise,
feel free to upload your own.

```bash
[exp] No currently active or previous builds for this project.

Would you like to upload a keystore or have us generate one for you?
If you don't know what this means, let us handle it! :)

  1) Let Expo handle the process!
  2) I want to upload my own keystore!
```

> **Note:** If you choose the first option and later decide to upload your own keystore, we currently offer an option to clear your current Android keystore from our build servers by running `exp build:android --clear-credentials.` **This is irreversible, so only run this command if you know what you are doing!** You can download a backup copy of the keystore by running `exp fetch:android:keystore`. If you do not have a local copy of your keystore , you will be unable to publish new versions of your app to the Play Store. Your only option would be to generate a new keystore and re-upload your application as a new application. You can learn more about how code signing and keystores work [in the Android documentation](https://developer.android.com/studio/publish/app-signing.html).

### If you choose to build for iOS

You are given a choice of letting the `exp` client create the
necessary credentials for you, while still having a chance to provide
your own overrides. Your Apple ID and password is used locally and
never saved on Expo's servers.

```bash
[exp] Making sure project is set up correctly...
[exp] Your project looks good!
[exp] Checking if current build exists...

[exp] No currently active or previous builds for this project.
? How would you like to upload your credentials?
 (Use arrow keys)
❯ Expo handles all credentials, you can still provide overrides
  I will provide all the credentials and files needed, Expo does no validation
```

We ask you if you'd like us to handle your distribution certificate or
use your own. Similar to the Android keystore, if you don't know what
a distribution certificate is, just let us handle it for you. If you
do need to upload your own certificates, we recommend following
[this excellent guide on making a p12file](https://calvium.com/how-to-make-a-p12-file/).

> **Note:** The Expo build service supports both normal App Store distribution as well as enterprise
> distribution. To use the latter, you must be a member of the ["Apple Developer Enterprise
> Program"](https://developer.apple.com/programs/enterprise/). Only normal Apple developer accounts
> can build apps that can be submitted to the Apple App Store, and only enterprise developer
> accounts can build apps that can be distributed using enterprise distribution methods. When you
> call `exp build:ios`, use the `--apple-enterprise-account` flag. At this time, the standalone app
> builder does not support "ad hoc" distribution certificates or provisioning profiles.

## 4. Wait for it to finish building

We'll print a url you can visit (such as `expo.io/builds/some-unique-id`) to watch your build logs. Alternatively, you can check up on it by running `exp build:status`. When it's done, you'll see the url of a `.apk` (Android) or `.ipa` (iOS) file -- this is your app. Copy and paste the link into your browser to download the file.

> **Note:** We enable bitcode for iOS, so the `.ipa` files for iOS are much larger than the eventual App Store download available to your users. For more information, see [App Thinning](https://developer.apple.com/library/content/documentation/IDEs/Conceptual/AppDistributionGuide/AppThinning/AppThinning.html).

## 5. Test it on your device or simulator

* You can drag and drop the `.apk` into your Android emulator. This is the easiest way to test out that the build was successful. But it's not the most satisfying.
* **To run it on your Android device**, make sure you have the Android platform tools installed along with `adb`, then just run `adb install app-filename.apk` with [USB debugging enabled on your device](https://developer.android.com/studio/run/device.html#device-developer-options) and the device plugged in.
* **To run it on your iOS Simulator**, first build your expo project with the simulator flag by running `exp build:ios -t simulator`, then download the tarball with the link given upon completion when running `exp build:status`. Unpack the tar.gz by running `tar -xvzf your-app.tar.gz`. Then you can run it by starting an iOS Simulator instance, then running `xcrun simctl install booted <app path>` and `xcrun simctl launch booted <app identifier>`.
* **To test a device build with Apple TestFlight**, download the .ipa file to your local machine. You are ready to upload your app to TestFlight. Within TestFlight, click the plus icon and create a New App. Make sure your `bundleIdentifier` matches what you've placed in `app.json`.

> **Note:** You will not see your build here just yet! You will need to use Xcode or Application Loader to upload your IPA first. Once you do that, you can check the status of your build under `Activity`. Processing an app can take 10-15 minutes before it shows up under available builds.

## 6. Submit it to the appropriate store

We don't automate this step (yet), but at this point you should be able to follow the Apple and Google documentation to submit your standalone binary to each respective store. For more info on how to polish your app and ensure it is accepted to the Apple and Google marketplaces, read the guide on [Deploying to App Stores](../app-stores/).

## 7. Update your app

For the most part, when you want to update your app, just Publish again from exp or XDE. Your users will download the new JS the next time they open the app. To ensure your users have a seamless experience downloading JS updates, you may want to enable [background JS downloads](../../guides/offline-support/). However, there are a couple reasons why you might want to rebuild and resubmit the native binaries:

* If you want to change native metadata like the app's name or icon
* If you upgrade to a newer `sdkVersion` of your app (which requires new native code)

To keep track of this, you can also update the binary's [versionCode](../configuration/#versioncode) and [buildNumber](../configuration/#buildnumber). It is a good idea to glance through the [app.json documentation](../configuration/) to get an idea of all the properties you can change, e.g. the icons, deep linking url scheme, handset/tablet support, and a lot more.

If you run into problems during this process, we're more than happy to help out! [Join our Forums](https://forums.expo.io/) and let us know if you have any questions.
