# Developing Expo Go

- [Introduction](#introduction)
- [External Contributions](#external-contributions)
- [Configuring your environment](#configuring-your-environment)
  - [iOS](#ios)
  - [Android](#android)
- [Running on a Device](#running-on-a-device)
  - [iOS](#ios-1)
  - [Android](#android-1)
- [Standalone Apps](#standalone-apps)
  - [Android](#android-2)
  - [iOS](#ios-2)
- [Modifying JS Code](#modifying-js-code)
- [Tests](#tests)
  - [iOS](#ios-3)

## Introduction

This is the source code for the Expo Go app used to view projects published to the Expo service. If you want to build and install Expo Go directly onto a device, you're in the right place. Note that if you just want to install Expo Go on a simulator, you do not need to build it from source. Instead, you should [follow the instructions here](https://docs.expo.dev/versions/latest/introduction/installation.html).

To build Expo Go, follow the instructions in the [Setup](#configuring-your-environment) section below. Use the [Expo CLI](https://docs.expo.dev/workflow/expo-cli) to use Expo's infrastructure to build your app.

Please ask us on the [forums](https://forums.expo.dev) if you get stuck.

## External Contributions

Please check with us before putting work into a Pull Request! We don't yet have a good guide available that covers the nuances of how to work with Expo Go and the types of PRs that we accept, so you will want a direct line of communication with someone on the team to ask us questions. The best place to talk to us is either on Discord at https://chat.expo.dev or the forums at https://forums.expo.dev.

**Disclaimers:**

If you want to build a standalone app that has a custom icon and name, see [our documentation here](https://docs.expo.dev/classic/building-standalone-apps). You're in the wrong place and you shouldn't need to build Expo Go from source.

If you need to make native code changes to your Expo project, such as adding custom native modules, we can [generate a native project for you](https://docs.expo.dev/expokit/eject). You're in the wrong place and you shouldn't need to build Expo Go from source.

## Configuring your environment

> Note: We support building Expo Go only on macOS.

- Install [direnv](http://direnv.net/).
- Clone this repo; we recommend cloning it to a directory whose full path does not include any spaces (you should clone all the submodules with `git clone --recurse-submodules`).
- Run `yarn` in the root directory.
- Run `yarn setup:native` in the root directory.
- Run `yarn build` in the `packages/expo` directory.

### iOS

- Make sure you have latest non-beta Xcode installed.
- Run `et ios-generate-dynamic-macros`.
- Open and run `ios/Exponent.xcworkspace` in Xcode.

### Android

- Make sure you have Android Studio 3 or newer installed.
- See ["Running on a Device"](#running-on-a-device).

## Running on a Device

### iOS

- In Xcode's menu bar, open the **Xcode** drop-down menu, and select **Preferences**. Then in the **Accounts** tab of the preferences menu, add your personal or team Apple Developer account.
- Connect your test device to your computer with a USB cable.
- In Xcode's menu bar, open the **Product** drop-down menu, select **Destination**, then in the _Device_ grouping select your device.
- In the project navigator, select the **Exponent** project to bring up the project's settings, and then:
  - In the **General** tab, in the **Identity** section, put in a unique Bundle Identifier.
  - Also in the **General** tab, in the **Signing** section, select your personal or team Apple Developer account as your **Team**, and create a new signing certificate by clicking **Fix Issue**.
- In the project's settings page, select the **ExpoNotificationServiceExtension** target, and then:
  - In the **General** tab, in the **Identity** section, its Bundle Identifier should be prefixed with your unique Bundle Identifier. For example, if your unique Bundle Identifier is `host.exp.Exponent.unique`, then the Bundle Identifier for the notification service extension should be `host.exp.Exponent.unique.ExpoNotificationServiceExtension`.
- Finally, run the build.

### Android

- If the Play Store version of the Expo Go is installed on your test device, uninstall it.
- Connect your test device to your computer with a USB cable.
- Run `fastlane android start`, or alternately open the `android` directory in Android Studio, start it, and in the **Select Deployment Target** dialog, select your device.
  - Expo Go can be built with either `versioned` or `unversioned` flavor. The latter is highly recommended for development and is used by default in Android Studio. You can switch flavors in _Build Variants_ pane.
  - You can also run `./gradlew installUnversionedDebug` from the `android` directory.
  - If you're having trouble building the Android app, trying clearing your gradle cache with `./gradlew clean` and rebuilding.

## Standalone Apps

If you don't need custom native code outside of the Expo SDK, head over to [our documentation on building standalone apps without needing Android Studio and Xcode](https://docs.expo.dev/classic/building-standalone-apps).

If you need standalone apps as built by running `expo build:ios` or `expo build:android` for a supported SDK version, check out our docs on [using turtle-cli to build apps locally or on CI](https://docs.expo.dev/classic/turtle-cli).

If you're still here, you need to build a standalone app with code currently on `main` or another unreleased branch. Make sure to follow the [Configure app.json](https://docs.expo.dev/classic/building-standalone-apps/#2-configure-appjson) section of the docs before continuing. You'll need to add the appropriate fields to your `app.json` before the standalone app scripts can run. Once that's done, continue on to the platform-specific instructions.

### Android

The Android standalone app script creates a new directory `android-shell-app` with the modified Android project in it. It then compiles that new directory giving you a signed or unsigned `.apk` depending on whether you provide a keystore and the necessary passwords. If there are issues with the app you can open the `android-shell-app` project in Android Studio to debug.

Here are the steps to build a standalone Android app:

- Publish your experience with Expo CLI. Note the published URL.
- If you want a signed `.apk`, run `et android-shell-app --url [the published experience url] --sdkVersion [sdk version of your experience] --keystore [path to keystore] --alias [keystore alias] --keystorePassword [keystore password] --keyPassword [key password]`.
- If you don't want a signed `.apk`, run `et android-shell-app --url [the published experience url] --sdkVersion [sdk version of your experience]`.
- The `.apk` file will be at `/tmp/shell-signed.apk` for a signed `.apk` or at `/tmp/shell-debug.apk` for an unsigned `.apk`.

### iOS

The iOS standalone app script has two actions, `build` and `configure`:

- `build` creates an archive or a simulator build of the Expo iOS workspace,
- `configure` accepts a path to an existing archive and modifies all its configuration files so that it will run as a standalone Expo project rather than in Expo Go.

Here are the steps to build a standalone iOS app:

- Publish your experience with Expo CLI. Note the published URL.
- `et ios-shell-app --action build --type [simulator or archive] --configuration [Debug or Release]`
- The resulting archive will be created at `../shellAppBase-[type]`.
- `et ios-shell-app --url [the published experience url] --action configure --type [simulator or archive] --archivePath [path to ExpoKitApp.app] --sdkVersion [sdk version of your experience] --output your-app.tar.gz`
- This bundle is not signed and cannot be submitted to iTunes Connect as-is; you'll need to manually sign it if you'd like to submit it to Apple. [Fastlane](https://fastlane.tools/) is a good option for this. Also, [Expo will do this for you](https://docs.expo.dev/classic/building-standalone-apps) if you don't need to build this project from source.
- If you created a simulator build in the first step, unpack the tar.gz using `tar -xvzf your-app.tar.gz`. Then you can run this on iPhone Simulator using `xcrun simctl install booted <app path>` and `xcrun simctl launch booted <app identifier>`. Another alternative which some people prefer is to install the [ios-sim](https://github.com/phonegap/ios-sim) tool and then use `ios-sim launch <app path>`.
- There are a few more optional flags you can pass to this script. They are all documented in the block comments inside `xdl/src/detach/IosShellApp.js`.

## Modifying JS Code

The Expo Go apps run a root Expo project in addition to native code. By default, this will use a published version of the project, so any changes made in the `home` directory will not show up without some extra work.

Serve this project locally by running `npx expo start --port=80` from the `home` directory. **On iOS**, you'll additionally need to set `DEV_KERNEL_SOURCE` to `LOCAL` in `EXBuildConstants.plist` (the default is `PUBLISHED`).

The native Android Studio and Xcode projects have a build hook which will find this if `expo start` is running. Keep this running and rebuild the app on each platform.

## Tests

### iOS

For native XCTest unit tests:

- Press Command+U in XCode to build and test the `Tests` unit test target.
- Alternatively, run `fastlane ios test` from the parent directory of `ios`.

For JS integration tests, test the `ExponentIntegrationTests` target (not included in the default test scheme). This target requires you to configure `EXTestEnvironment.plist` with a key `testSuiteUrl` whose value is the URL to load some version of Expo's [test-suite](../apps/test-suite) app. This will run a bunch of Jasmine tests against the Expo SDK.
