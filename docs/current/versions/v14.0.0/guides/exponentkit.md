---
title: Using ExponentKit to add Custom Native Modules
---

ExponentKit is an Objective-C and Java library that allows you to use the Exponent platform and
your existing Exponent project as part of a larger standard native project -- one that you would
normally create using Xcode, Android Studio, or `react-native init`.

## What is this for?

Normally, Exponent apps are written in pure JS and never "drop down" to the native iOS or Android
layer. This is core to the Exponent philosophy and it's part of what makes Exponent fast and
powerful to use.

However, there are some cases where advanced developers need native capabilities outside of what
Exponent offers out-of-the-box. The most common situation
is when a project requires a specific Native Module which is not supported by React Native Core
or the Exponent SDK.

## Detaching an Exponent project into a Native project with ExponentKit

You may find yourself in a situation where your Exponent project needs a native module that Exponent
doesn't currently support. We're always expanding the [Exponent SDK](/versions/v14.0.0/sdk/),
so we hope this is never the case. But it happens, especially if your app has very specific and uncommon
native demands.

In this case, Exponent allows you to `detach` your pure-JS project from the Exponent iOS/Android
clients, providing you with native projects that can be opened and built with Xcode and Android
Studio. Those projects will have dependencies on ExponentKit, so everything you already built
will keep working as it did before.

We call this "detaching" because you still depend on the Exponent SDK, but your project no
longer lives inside the standard Exponent client. You control the native projects, including
configuring and building them yourself.

**You don't need to do this if your main goal is to distribute your app in the iTunes Store or
Google Play.** Exponent can [build binaries for you](/versions/v14.0.0/guides/building-standalone-apps) in that case.
You should only `detach` if you need to make native code changes not available in the Exponent SDK.

>  **Warning:** We discourage most of our developers from taking this route, as we believe almost
>  everything you need to do is better accomplished in a cross-platform way with JS.
>
>  Writing in JS enables you to best take advantage of over-the-air code deployment and benefit from
>  ongoing updates and support from Exponent. You should only do this if you have a particular
>  demand from native code which Exponent won't do a good job supporting, such as (for example)
>  specialized CPU-intensive video processing that must happen locally on the device.

## Instructions

The following steps are for converting a pure-JS Exponent project (such as one created from XDE)
into a native iOS and Android project which depends on ExponentKit.

After you `detach`, all your JS files will stay the same, but we'll additionally create `ios` and
`android` directories in your project folder. These will contain Xcode and Android Studio projects
respectively, and they'll have dependencies on React Native and on Exponent's core SDK.

You'll still be able to develop and test your project from XDE, and you'll still be able to publish
your Exponent JS code the same way. However, if you add native dependencies that aren't included
in Exponent, other users won't be able to run those features of your app with the main Exponent app.
You'll need to distribute the native project yourself.

>  **Note:** `detach` is currently an alpha feature and you may run into issues. Proceed at your
>  own risk and please reach out to us with any feedback or issues you encounter.

### 1. Install exp

If you don't have it, run `npm install -g exp` to get our command line library.

If you haven't used `exp` or XDE before, the first thing you'll need to do is log in
with your Exponent account using `exp login`.

### 2. Detach

From your project directory, run `exp detach`. This will download the required dependencies and
build native projects under the `ios` and `android` directories.

### 3. Rerun the project in XDE or exp

Open the project in XDE. If you were already running this project in XDE, press Restart.

If you prefer `exp`, run `exp start` from the project directory.

### 4. (iOS only) Configure, build and run

To configure the Xcode project, make sure you have [CocoaPods](https://cocoapods.org), then
run `./pod-install-exponent.sh` from your project's `ios` directory.

You can now open your project's `xcworkspace` file in Xcode, build and run the project
on an iOS device or Simulator.

Once the iOS project is running, it should automatically request your development url from XDE
or `exp`. You can develop your project normally from here.

### 4. (Android only) Build and run

Open the `android` directory in Android Studio, then build and run the project on an Android device
or a Genymotion emulator.

Once the Android project is running, it should automatically request your development url from XDE
or `exp`. You can develop your project normally from here.

### 5. Make native changes

You can do whatever you want in the Xcode and Android Studio projects.

To add third-party native modules for React Native, non-exponent-specific instructions such as
`react-native link` should be supported.

>  **Note:** You may have to update `android/app/build.gradle` after running `react-native link`.
>  Change the line added by `react-native link` from `compile project(':library-name')` to
>  `compile(project(':library-name')) { exclude module: 'react-native' }`.

### 6. Distribute your app

Publishing your JS from XDE/exp will still work. Users of your app will get the new JS on their
devices as soon as they reload their app; you don't need to rebuild your native code if it has
not changed.

If you do make native changes, people who don't have your native code may encounter crashes if
they try to use features that depend on those changes.

If you decide to distribute your app as an `ipa` or `apk`, it will automatically hit
your app's published URL instead of your development XDE url. You can examine this configuration
in the contents of `EXShell.plist` (iOS) or `MainActivity.java` (Android).

Before taking your app all the way to production, it's a good idea to glance over the [Advanced ExponentKit Topics](/versions/v14.0.0/guides/advanced-exponentkit-topics) guide.
