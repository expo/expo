# Exponent [![Slack](https://slack.getexponent.com/badge.svg)](https://slack.getexponent.com)

The Exponent app for Android and iOS.

To develop or run Exponent experiences on your device, download Exponent [for Android 4.4+ from the Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) or [for iOS 8+ from the App Store](https://itunes.com/apps/exponent). [Click here for instructions to install the app on an iOS simulator or Android emulator](https://docs.getexponent.com/versions/latest/introduction/installation.html#mobile-client-exponent-for-ios-and-android).

[Click here to view our documentation](https://docs.getexponent.com) for developing on Exponent.

## Introduction

This is the source code for the Exponent app used to view experiences published to the Exponent service. **Most people will not need to build Exponent from source**.

If you want to build a standalone app that has a custom icon and name, see [our documentation here](https://docs.getexponent.com/versions/latest/guides/building-standalone-apps.html). You're in the wrong place, you shouldn't need to build the Exponent clients from source.

If you need to make native code changes to your Exponent project, such as adding custom native modules, we can [generate a native project for you](https://docs.getexponent.com/versions/latest/guides/changing-native-code.html). You're in the wrong place, you shouldn't need to build the Exponent clients from source.

If you want to build the Exponent client apps for some reason, there are a few steps to getting this working:
- Join us on Slack at https://slack.getexponent.com/. The code base and build process is complicated so please ask us if you get stuck.
- Get the iOS and Android clients building on your machine using the [Set Up](#set-up) section below.
- Make your native changes and test. You can still use [XDE](https://github.com/exponent/xde) or [exp](https://github.com/exponent/exp) and the rest of Exponent's infrastructure.

## Set Up

Please use Node 6 and npm 3. We recommend installing Node using [nvm](https://github.com/creationix/nvm). We support building the clients only on macOS.

- `npm install` in the `js` and `tools-public` directories.
- Install [the Gulp CLI](http://gulpjs.com/) globally: `npm i gulp-cli -g`.
- Run the packager with `cd tools-public && gulp`. Leave this running while you run the clients. The clients access this packager using your computer's IP, so make sure that your computer and device are on the same WiFi network.

#### Android
- Make sure you have Android Studio 2 and the [Android NDK](https://facebook.github.io/react-native/docs/android-building-from-source.html#download-links-for-android-ndk) version `r10e` installed.
- Build and install Android with `cd android && ./run.sh && cd ..`.

#### iOS
- Make sure you have latest non-beta Xcode installed.
- Install [Cocoapods](https://cocoapods.org/): `gem install cocoapods --no-ri --no-rdoc`.
- `cd tools-public && ./generate-files-ios.sh && cd ..`.
- `cd ios && pod install && cd ..`.
- Run iOS project by opening `ios/Exponent.xcworkspace` in Xcode.

Once the you have the clients running you should be able to open any Exponent experience in them by opening an `exp://` url on the device or navigating to a url in the app's url bar.

Note: If you have the Exponent app from the Play Store or the App Store you will have to uninstall those before installing this client.

## Standalone Apps

If you don't need custom native code outside of the Exponent SDK, head over to [our documentation on building standalone apps without needing Android Studio and Xcode](https://docs.getexponent.com/versions/latest/guides/building-standalone-apps.html).

If you're still here, make sure to follow the [Configure exp.json](https://docs.getexponent.com/versions/latest/guides/building-standalone-apps.html#configure-exp-json) section of the docs before continuing. You'll need to add the appropriate fields to your `exp.json` before the standalone app scripts can run. Once that's done, continue on to the platform-specific instructions.

#### Android
The Android standalone app script creates a new directory `android-shell-app` with the modified Android project in it. It then compiles that new directory giving you a signed or unsigned `.apk` depending on whether you provide a keystore and the necessary passwords. If there are issues with the app you can open the `android-shell-app` project in Android Studio to debug.

Here are the steps to build a standalone Android app:
- Publish your experience from `XDE` or `exp`. Note the published url.
- `cd tools-public`.
- If you want a signed `.apk`, run `gulp android-shell-app --url [the published experience url] --sdkVersion [sdk version of your experience] --keystore [path to keystore] --alias [keystore alias] --keystorePassword [keystore password] --keyPassword [key password]`.
- If you don't want a signed `.apk`, run `gulp android-shell-app --url [the published experience url] --sdkVersion [sdk version of your experience]`.
- The `.apk` file will be at `/tmp/shell-signed.apk` for a signed `.apk` or at `/tmp/shell-unaligned.apk` for an unsigned `.apk`.
- `adb install` the `.apk` file to test it.
- Upload to the Play Store!

#### iOS
The iOS standalone app script has two actions, `build` and `configure`. `build` creates an archive or a simulator build of the Exponent iOS workspace. `configure` accepts a path to an existing archive and modifies all its configuration files so that it will run as a standalone Exponent experience rather than as the Exponent app.

Here are the steps to build a standalone iOS app:
- Publish your experience from `XDE` or `exp`. Note the published url.
- `cd tools-public`.
- `gulp ios-shell-app --action build --type [simulator or archive] --configuration [Debug or Release]`
- The resulting archive will be created at `../shellAppBase-[type]`.
- `gulp ios-shell-app --url [the published experience url] --action configure --type [simulator or archive] --archivePath [path to Exponent.app] --sdkVersion [sdk version of your experience]`
- This bundle is not signed and cannot be submitted to iTunes Connect as-is; you'll need to manually sign it if you'd like to submit it to Apple. [Fastlane](https://fastlane.tools/) is a good option for this. Also, [Exponent will do this for you](https://docs.getexponent.com/versions/latest/guides/building-standalone-apps.html) if you don't need to build this project from source.
- If you created a simulator build in the first step, you can run this on iPhone Simulator using `xcrun simctl install booted <app path>` and `xcrun simctl launch booted <app identifier>`. Another alternative which some people prefer is to install the [ios-sim](https://github.com/phonegap/ios-sim) tool and then use `ios-sim launch <app path>`.
- There are a few more optional flags you can pass to this script. They are all documented in the block comment for `createIOSShellAppAsync()` inside `ios-shell-app.js`.

## Project Layout

- `android` contains the Android project.
- `ios` contains the iOS project.
- `ios/Exponent.xcworkspace` is the Xcode workspace. Always open this instead of `Exponent.xcodeproj` because the workspace also loads the CocoaPods dependencies.
- `js` contains the JavaScript source code of the app.
- `tools-public` contains programs to launch the packager and also build tools.
- `template-files` contains templates for files that require private keys. They are populated using the keys in `template-files/keys.json`.
- `template-files/ios/dependencies.json` specifies the CocoaPods dependencies of the app.

## Contributing
Please check with us before putting work into a Pull Request! It is often harder to maintain code than it is to write it. The best place to talk to us is on Slack at https://slack.getexponent.com.

## License
The Exponent source code is made available under the [BSD 3-clause license](LICENSE). Some of the dependencies are licensed differently, with the MIT license, for example.
