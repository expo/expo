---
title: Walkthrough
---

Let's get started by building Android and iOS app binaries for a fresh bare project initialized with Expo CLI.

## Prerequisites

- Install Expo CLI by running `npm install -g expo-cli` (or `yarn global add expo-cli`). This is needed for initializing a new project.
- Install EAS CLI by running `npm install -g eas-cli` (or `yarn global add eas-cli`). _If you already have it, make sure you're using the latest version._ EAS Build is in alpha and it's changing rapidly, so the only way to ensure that you will have the best experience is to use the latest eas-cli version.
- Sign in with `expo login`, or sign up with `expo register` if you don't have an Expo account yet. You can check if you're logged in by running `expo whoami`.

## Initialize a New Project

Run `expo init PROJECT_NAME` (let's assume `PROJECT_NAME` is `abcd`) and choose a bare workflow template (either `minimal` or `minimal (TypeScript)`).

<center><img src="/static/images/eas-build/walkthrough/01-init.png" /></center>

Initializing the project can take a few minutes. Once it's all set, you should see `✅ Your project is ready!` in logs.

<center><img src="/static/images/eas-build/walkthrough/02-init-complete.png" /></center>

## Set application identifiers

Before configuring the project for EAS Build, you'll need to set identifiers that will be used to identify your application on the Apple App Store and Google Play.

### Set an application ID for Android:

An excerpt from [Android docs](https://developer.android.com/studio/build/application-id):

> The application ID looks like a traditional Java package name, the naming rules for the application ID are a bit more restrictive:
>
> - It must have at least two segments (one or more dots).
> - Each segment must start with a letter.
> - All characters must be alphanumeric or an underscore [a-zA-Z0-9_].

To set the application ID, open `app.json`, and add a `package` property under the `expo.android` key.

### Set a bundle identifier for iOS

An excerpt from [Apple docs](https://developer.apple.com/library/archive/documentation/CoreFoundation/Conceptual/CFBundles/BundleTypes/BundleTypes.html#//apple_ref/doc/uid/10000123i-CH101-SW1):

> The bundle identifier string identifies your application to the system. This string must be a uniform type identifier (UTI) that contains only alphanumeric (A-Z,a-z,0-9), hyphen (-), and period (.) characters. The string should also be in reverse-DNS format. For example, if your company’s domain is Ajax.com and you create an application named Hello, you could assign the string com.Ajax.Hello as your application’s bundle identifier.

To set the bundle identifier, open `app.json`, and add a `bundleIdentifier` property under the `expo.ios` key.

### Make a commit

Commit those changes:

- `git add app.json`
- `git commit -m "Set android.package and ios.bundleIdentifier"`

<center><img src="/static/images/eas-build/walkthrough/03-set-application-ids.png" /></center>

## Configure your project for EAS Build

To automatically configure your native project for building with EAS Build on Android and iOS, you will need to run the following command:

```
$ eas build:configure
```

EAS CLI will automatically perform the following steps:

#### 1. Ask you about the platform(s) to configure

It's recommended to configure both Android and iOS.

<center><img src="/static/images/eas-build/walkthrough/04-configure-platform.png" /></center>

#### 2. Create eas.json

The command will create an `eas.json` file in the root directory with the following contents:

```json
{
  "builds": {
    "android": {
      "release": {
        "workflow": "generic"
      }
    },
    "ios": {
      "release": {
        "workflow": "generic"
      }
    }
  }
}
```

This is your EAS Build configuration. It defines a single build profile named `release` (you can have multiple build profiles like `release`, `debug`, `testing`, etc.) for each platform. In the generated configuration, each profile declares that the project is a generic React Native project (unlike a managed Expo project which doesn't contain native code in the project tree). If you want to learn more about `eas.json` see the [Configuration with eas.json](eas-json.md) page.

#### 3. Configure the Android project

EAS CLI performs two steps:

- It resolves the application ID and updates `build.gradle` with it.

  > Because we previously set the Android application ID in app.json, you'll be asked to choose between that and the application ID defined in the native project (this is the default that comes from `expo init`).
  >
  > It's important that you choose the application ID defined in app.json because this is how your application will be identified on the Google Play Store.

- It auto-configures your Gradle project so we could build it on our servers.

  > This step also patches `build.gradle` by including there our custom signing configuration. The configuration itself is saved to a separate file: `eas-build.gradle`.

<center><img src="/static/images/eas-build/walkthrough/05-configure-android.png" /></center>

#### 4. Configure the iOS project

Similar configuration step is performed for the iOS project. EAS Build resolved the bundle identifier and updates the `project.pbxproj` file.

Make sure to choose the bundle identifier defined in app.json because it'll be used to identify you app on the Apple App Store.

<center><img src="/static/images/eas-build/walkthrough/06-configure-xcode.png" /></center>

#### 5. Ask you to commit the configuration changes

Next, choose to commit the changes we made. You can customize the message if you want.

<center><img src="/static/images/eas-build/walkthrough/07-configure-commit.png" /></center>

#### 6. Inform you about next steps

Once it's all set, you should see `🎉 Your iOS and Android projects are ready to build.` in logs.

<center><img src="/static/images/eas-build/walkthrough/08-configure-complete.png" /></center>

## Building for Android

To start an Android build of your app, run `eas build --platform android`.

You will be guided through generating or providing your own keystore. For the sake of simplicity in this tutorial, select `Generate new keystore` and hit enter.

**Warning: If you've previously set up credentials for an app with the same slug, Expo CLI will try to reuse them.**

<center><img src="/static/images/eas-build/walkthrough/09-build-android-keystore.png" /></center>

The build should start shortly after the keystore is generated (and securely stored on Expo servers). EAS CLI will print a URL where you can monitor the progress of your build.

<center><img src="/static/images/eas-build/walkthrough/10-build-android-queued.png" /></center>

The build logs page looks like this:

<center><img src="/static/images/eas-build/walkthrough/11-build-android-logs.png" /></center>

Once the build completes, you can download the app binary by either visiting the build details page (and clicking the download button), or by opening the URL printed by EAS CLI:

<center><img src="/static/images/eas-build/walkthrough/12-build-android-finished-web.png" /></center>
<center><img src="/static/images/eas-build/walkthrough/13-build-android-finished-terminal.png" /></center>

## Building for iOS

To start an iOS build of your app, run `eas build --platform ios`.

Next, you'll be guided through generating the app's credentials. You'll be asked to login to the Apple Developer Portal and choose your team for the iOS project.

**Warning: If you've previously set up credentials for an app with the same slug, Expo CLI will try to reuse them.**

The build should start shortly after that. Once it completes, you can download the app binary the same way you did with the Android counterpart - either via the build status page or opening the URL that's printed to your console.

<center><img src="/static/images/eas-build/walkthrough/14-build-ios-finished-terminal.png" /></center>
<center><img src="/static/images/eas-build/walkthrough/15-build-ios-finished-web.png" /></center>
