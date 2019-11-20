---
title: Building Standalone Apps on Your CI
---

> **NOTE:** macOS is required to build standalone iOS apps.

This guide describes an advanced feature of Expo. In most cases you can build
standalone Expo apps using Expo's build services as described in the guide
on [Building Standalone Apps](../building-standalone-apps/).

If you prefer to not rely on our builders stability and you don't like waiting
in the queue to get your standalone app build then you can build your Expo
project on your own. The only thing you need is Turtle CLI. Turtle CLI is
a command line interface for building Expo standalone apps. You can use it
both on your CI and your private computer.

## Install Turtle CLI

### Prerequisites

You'll need to have these things installed:
- bash
- Node.js (version 8 or newer) - [download the latest version of Node.js](https://nodejs.org/en/).

#### For Android builds

- [Java Development Kit (version 8)](https://jdk.java.net/)

#### For iOS builds

- macOS
- Xcode (version 9.4.1 or newer) - make sure you have run it at least once
and you have agreed to the license agreements. Alternatively you can run `sudo xcodebuild -license`.
- fastlane - [see how to install it](https://docs.fastlane.tools/getting-started/ios/setup/#installing-fastlane)

### Turtle CLI

Install Turtle CLI by running:

```bash
$ npm install -g turtle-cli
```

Then run `turtle setup:ios` and/or `turtle setup:android` to verify everything
is installed correctly. This step is optional and is also performed during
the first run of the Turtle CLI. Please note that the Android setup command
downloads, installs, and configures the appropriate versions of the Android SDK
and NDK.

If you would like to make the first build even faster, you can supply the Expo
SDK version to the setup command like so: `turtle setup:ios --sdk-version 30.0.0`.
This tells Turtle CLI to download additional Expo-related dependencies for
the given SDK version.

All Expo-related dependencies will be installed in a directory named `.turtle`
within your home directory. This directory may be removed safely if you ever
need to free up some disk space.

## Publish your project

In order to build your standalone Expo app, you first need to have successfully
published your project. See the guide on [how to publish your project](../../workflow/publishing/)
with Expo CLI or [how to host an app on your servers](../hosting-your-app/).

## Start the build

If you choose to publish your app to Expo servers, you must have an Expo
developer account and supply your credentials to the `turtle-cli`.
The recommended approach is to define two environment variables called
`EXPO_USERNAME` and `EXPO_PASSWORD` with your credentials, though you may also
pass these values to the build command from the command line. We recommending
using the environment variables to help keep your credentials out of your
terminal history or CI logs.

### Building for Android

Before starting the build, prepare the following things:

- Keystore
- Keystore alias
- Keystore password and key password

To learn how to generate those, see the guide on [Building Standalone Apps](../building-standalone-apps/)
first.

Set the `EXPO_ANDROID_KEYSTORE_PASSWORD` and `EXPO_ANDROID_KEY_PASSWORD`
environment variables with the values of the keystore password and key password,
respectively.

Then, start the standalone app build:
```bash
$ turtle build:android \\
  --keystore-path /path/to/your/keystore.jks \\
  --keystore-alias PUT_KEYSTORE_ALIAS_HERE
```

If the build finishes successfully you will find the path to the build artifact
in the last line of the logs.

If you want to print the list of all available command arguments,
please run `turtle build:android --help`.

### Building for iOS

Prepare the following unless you're building only for the iOS simulator:

- Apple Team ID - (a 10-character string like "Q2DBWS92CA")
- Distribution Certificate .p12 file *(+ password)*
- Provisioning Profile

To learn how to generate those, see the guide
on [Building Standalone Apps](../building-standalone-apps/) first.

Set the `EXPO_IOS_DIST_P12_PASSWORD` environment variable with the value of
the Distribution Certificate password.

Then, start the standalone app build:
```bash
$ turtle build:ios \\
  --team-id YOUR_TEAM_ID \\
  --dist-p12-path /path/to/your/dist/cert.p12 \\
  --provisioning-profile-path /path/to/your/provisioning/profile.mobileprovision
```

If the build finishes successfully you will find the path to the build artifact
in the last line of the logs.

If you want to print the list of all available command arguments,
please run `turtle build:ios --help`.


## CI configuration file examples

See [expo/turtle-cli-example](https://github.com/expo/turtle-cli-example) repository
for examples of how to use Turtle CLI with popular CI services (i.e. [CircleCI](#circleci)
and [Travis CI](#travis-ci)).
