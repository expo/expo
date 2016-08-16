# Exponent [![Slack](http://slack.exponentjs.com/badge.svg)](http://slack.exponentjs.com)

The Exponent app for Android and iOS.

[Download for Android 4.4+ from the Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) or [for iOS 8+ from the App Store](https://itunes.com/apps/exponent).

[Click here for instructions to install the app on an iOS simulator or Android emulator](https://docs.getexponent.com/versions/latest/introduction/installation.html#mobile-client-exponent-for-ios-and-android).

[Click here to view our documentation](https://docs.getexponent.com).

## Introduction

This is the source code for the Exponent app used to view experiences published to the Exponent service. **Most people will not need to build Exponent from source**. If you don't need any custom native modules that we don't support you should download the client from one of the links above.

If you want to build a standalone app that has a custom icon and name, see [our documentation here](https://docs.getexponent.com/versions/latest/guides/building-standalone-apps.html). You shouldn't need
to build the Exponent clients from source.

If you want to build a standalone app that has a custom icon, a custom name, and needs custom native modules, you're in the right place! There are a few steps to getting this working:
* Get the iOS and Android clients building on your machine using the [Set Up](#set-up) section below.
* Add your native modules and test. You can still use [XDE](https://github.com/exponentjs/xde) or [exp](https://github.com/exponentjs/exp) and the rest of Exponent's infrastructure.
* When you want to create your final `.apk` and `.ipa` files, follow the instructions in the [Standalone Apps](#standalone-apps) section below.

## Set Up

Please use Node 6 and npm 3. We recommend installing Node using [nvm](https://github.com/creationix/nvm).

- `npm install` in the `js` and `tools-public` directories.
- Install [the Gulp CLI](http://gulpjs.com/) globally: `npm i gulp-cli -g`.
- Run the packager with `cd tools-public && gulp`. Leave this running while you run the clients.

### Android
- Make sure you have Android Studio 2 and the [Android NDK](https://facebook.github.io/react-native/docs/android-building-from-source.html#download-links-for-android-ndk) version `r10e` installed.
- Build and install Android with `cd android && ./run.sh && cd ..`.

### iOS
- Make sure you have Xcode 7 installed.
- Install [Cocoapods](https://cocoapods.org/): `gem install cocoapods --no-ri --no-rdoc`.
- `cd tools-public && ./generate-files-ios.sh && cd ..`.
- `cd ios && pod install && cd ..`.
- Run iOS project by opening `ios/Exponent.xcworkspace` in Xcode.

Once the you have the clients running you should be able to open any Exponent experience in them by opening an `exp://` url on the device or navigating to a url in the app's url bar.

Note: If you have the Exponent app from the Play Store or the App Store you will have to uninstall those before installing this client.

## Standalone Apps

## Project Layout

- `android` contains the Android project.
- `ios/Exponent.xcworkspace` is the Xcode workspace. Always open this instead of `Exponent.xcodeproj` because the workspace also loads the CocoaPods dependencies.
- `ios` contains the iOS project.
- `ios/Podfile` specifies the CocoaPods dependencies of the app.
- `js` contains the JavaScript source code of the app.
- `tools-public` contains programs to launch the packager and also build tools.

## Contributing
Please check with us before putting work into a Pull Request! The best place to talk to us is on
Slack at https://slack.exponentjs.com/.
