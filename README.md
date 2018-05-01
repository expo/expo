# Expo Client [![Slack](https://slack.expo.io/badge.svg)](https://slack.expo.io)

The Expo client app for Android and iOS.

[Click here to view our documentation](https://docs.expo.io) for developing on Expo.

## Introduction

This is the source code for the Expo client app used to view experiences published to the Expo service. If you want to build and install the Expo client directly onto a device, you're in the right place. Note that if you just want to install the Expo client app on a simulator, you do not need to build it from source. Instead, you should [follow the instructions here](https://docs.expo.io/versions/latest/introduction/installation.html).

To build the Expo client app, follow the instructions in the [Set Up](#set-up) section below. You'll be able to use [XDE](https://github.com/expo/xde) or [exp](https://github.com/expo/exp) and the rest of Expo's infrastructure with the app you build.

Please ask us on the [forums](https://forums.expo.io/) if you get stuck.

**Disclaimers:**

If you want to build a standalone app that has a custom icon and name, see [our documentation here](https://docs.expo.io/versions/latest/guides/building-standalone-apps.html). You're in the wrong place, you shouldn't need to build the Expo clients from source.

If you need to make native code changes to your Expo project, such as adding custom native modules, we can [generate a native project for you](https://docs.expo.io/versions/latest/guides/changing-native-code.html). You're in the wrong place, you shouldn't need to build the Expo clients from source.

## Set Up

Please use Node 8+ and npm 4. We recommend installing Node using [nvm](https://github.com/creationix/nvm). We support building the clients only on macOS.

- Install [the Gulp CLI](http://gulpjs.com/) globally: `npm install gulp-cli -g`.
- Run `npm install` in the `js` and `tools-public` directories.

#### iOS
- Make sure you have latest non-beta Xcode installed.
- Install [Cocoapods](https://cocoapods.org/): `gem install cocoapods --no-ri --no-rdoc`
- Run `pod install` in the `ios` directory.
- Open and run `ios/Exponent.xcworkspace` in Xcode.

#### Android
- Make sure you have Android Studio 2 and the [Android NDK](https://facebook.github.io/react-native/docs/building-from-source.html#download-links-for-android-ndk) version `r10e` installed.
- Build and install Android with `cd android; ./run.sh; cd ..`. It might fail the first time. If so just run `./run.sh` again.

If you are running on an phone with Android 5 you might have to use `./run.sh installDev19Debug`. There is a bug running multidex applications in debug mode on Android 5 devices: https://code.google.com/p/android/issues/detail?id=79826.

**These instructions are different if you are using Expo's internal monorepo.** In that case, read the `__internal__` instructions instead.

## Running on a Device

### iOS
- In Xcode's menu bar, open the **Xcode** drop-down menu, and select **Preferences**.  Then in the **Accounts** tab of the preferences menu, add add your personal or team apple developer account.
- Connect your test device to your computer with a USB cable.
- In Xcode's menu bar, open the **Product** drop-down menu, select **Destination**, then in the _Device_ grouping select your device.
- In the project navigator, select the **Exponent** project to bring up the project's settings, and then:
  - In the **General** tab, in the **Identity** section, put in a unique Bundle Identifier.
  - Also in the **General** tab, in the **Signing** section, select your personal or team apple developer account as your **Team**, and create a new signing certificate by clicking **Fix Issue**.
- Finally, run the build

### Android
- If the Play Store version of the Expo Client App is installed on your test device, uninstall it.
- Connect your test device to your computer with a USB cable.
- Run `cd android; ./run.sh`, or alternately open the `android` directory in Android Studio, start it, and in the **Select Deployment Target** dialog, select your device.

## Standalone Apps

If you don't need custom native code outside of the Expo SDK, head over to [our documentation on building standalone apps without needing Android Studio and Xcode](https://docs.expo.io/versions/latest/guides/building-standalone-apps.html).

If you're still here, make sure to follow the [Configure app.json](https://docs.expo.io/versions/latest/guides/building-standalone-apps.html#2-configure-appjson) section of the docs before continuing. You'll need to add the appropriate fields to your `app.json` before the standalone app scripts can run. Once that's done, continue on to the platform-specific instructions.

#### Android
The Android standalone app script creates a new directory `android-shell-app` with the modified Android project in it. It then compiles that new directory giving you a signed or unsigned `.apk` depending on whether you provide a keystore and the necessary passwords. If there are issues with the app you can open the `android-shell-app` project in Android Studio to debug.

Here are the steps to build a standalone Android app:
- Publish your experience from `XDE` or `exp`. Note the published url.
- `cd tools-public`.
- If you want a signed `.apk`, run `gulp android-shell-app --url [the published experience url] --sdkVersion [sdk version of your experience] --keystore [path to keystore] --alias [keystore alias] --keystorePassword [keystore password] --keyPassword [key password]`.
- If you don't want a signed `.apk`, run `gulp android-shell-app --url [the published experience url] --sdkVersion [sdk version of your experience]`.
- The `.apk` file will be at `/tmp/shell-signed.apk` for a signed `.apk` or at `/tmp/shell-debug.apk` for an unsigned `.apk`.
- `adb install` the `.apk` file to test it.
- Upload to the Play Store!

#### iOS
The iOS standalone app script has two actions, `build` and `configure`. `build` creates an archive or a simulator build of the Expo iOS workspace. `configure` accepts a path to an existing archive and modifies all its configuration files so that it will run as a standalone Expo experience rather than as the Expo client app.

Here are the steps to build a standalone iOS app:
- Publish your experience from `XDE` or `exp`. Note the published url.
- `cd tools-public`.
- `gulp ios-shell-app --action build --type [simulator or archive] --configuration [Debug or Release]`
- The resulting archive will be created at `../shellAppBase-[type]`.
- `gulp ios-shell-app --url [the published experience url] --action configure --type [simulator or archive] --archivePath [path to ExpoKitApp.app] --sdkVersion [sdk version of your experience] --output your-app.tar.gz`
- This bundle is not signed and cannot be submitted to iTunes Connect as-is; you'll need to manually sign it if you'd like to submit it to Apple. [Fastlane](https://fastlane.tools/) is a good option for this. Also, [Expo will do this for you](https://docs.expo.io/versions/latest/guides/building-standalone-apps.html) if you don't need to build this project from source.
- If you created a simulator build in the first step, unpack the tar.gz using `tar -xvzf your-app.tar.gz`. Then you can run this on iPhone Simulator using `xcrun simctl install booted <app path>` and `xcrun simctl launch booted <app identifier>`. Another alternative which some people prefer is to install the [ios-sim](https://github.com/phonegap/ios-sim) tool and then use `ios-sim launch <app path>`.
- There are a few more optional flags you can pass to this script. They are all documented in the block comment for `createIOSShellAppAsync()` inside `xdl/src/detach/IosShellApp.js`.

## Modifying JS Code
The Expo client apps run a root Expo project in addition to native code. By default this will use a published version of the project, so any changes made in the `js` directory will not show up without some extra work.

Serve this project locally by running `exp start` from the `js` directory. On iOS, you'll additionally need to set `DEV_KERNEL_SOURCE` to `LOCAL` in `EXBuildConstants.plist` (the default is `PUBLISHED`).

The native Android Studio and XCode projects have a build hook which will find this if `exp start` is running. Keep this running and rebuild the app on each platform.

## Project Layout

- `android` contains the Android project.
- `ios` contains the iOS project.
- `ios/Exponent.xcworkspace` is the Xcode workspace. Always open this instead of `Exponent.xcodeproj` because the workspace also loads the CocoaPods dependencies.
- `js` contains the JavaScript source code of the app.
- `tools-public` contains build and configuration tools.
- `template-files` contains templates for files that require private keys. They are populated using the keys in `template-files/keys.json`.
- `template-files/ios/dependencies.json` specifies the CocoaPods dependencies of the app.

## Tests

### iOS

Press Command+U in XCode to build and test the `ExponentIntegrationTests` unit test target. Most of the tests are normal XCTests.

One test in particular, `testDoesTestSuiteAppPassAllJSTests`, requires you to configure `EXTestEnvironment.plist` with a key `testSuiteUrl` whose value is the url to load some version of Expo's [test-suite](https://github.com/expo/test-suite) app. This will run a bunch of Jasmine tests against the Expo SDK.

## Contributing
Please check with us before putting work into a Pull Request! It is often harder to maintain code than it is to write it. The best place to talk to us is on Slack at https://slack.expo.io.

## License
The Expo source code is made available under the [BSD 3-clause license](LICENSE). Some of the dependencies are licensed differently, with the MIT license, for example.
