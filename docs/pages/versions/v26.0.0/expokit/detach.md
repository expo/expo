---
title: Detaching to ExpoKit
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

ExpoKit is an Objective-C and Java library that allows you to use the Expo platform and your existing Expo project as part of a larger standard native project -- one that you would normally create using Xcode, Android Studio, or `react-native init`.

## What is this for?

If you created an Expo project in XDE and you want a way to add custom native modules, this guide will explain how to use ExpoKit for that purpose.

Normally, Expo apps are written in pure JS and never "drop down" to the native iOS or Android layer. This is core to the Expo philosophy and it's part of what makes Expo fast and powerful to use.

However, there are some cases where advanced developers need native capabilities outside of what Expo offers out-of-the-box. The most common situation is when a project requires a specific Native Module which is not supported by React Native Core or the Expo SDK.

In this case, Expo allows you to `detach` your pure-JS project from the Expo iOS/Android clients, providing you with native projects that can be opened and built with Xcode and Android Studio. Those projects will have dependencies on ExpoKit, so everything you already built will keep working as it did before.

We call this "detaching" because you still depend on the Expo SDK, but your project no longer lives inside the standard Expo client. You control the native projects, including configuring and building them yourself.

## Should I detach?

### You might want to detach if:

- Your Expo project needs a native module that Expo doesn't currently support. We're always expanding the [Expo SDK](../../sdk/), so we hope this is never the case. But it happens, especially if your app has very specific and uncommon native demands.

### You should not detach if:

- All you need is to distribute your app in the iTunes Store or Google Play. Expo can [build binaries for you](../../distribution/building-standalone-apps/) in that case. If you detach, we can't automatically build for you any more.
- You are uncomfortable writing native code. Detached apps will require you to manage Xcode and Android Studio projects.
- You enjoy the painless React Native upgrades that come with Expo. After your app is detached, breaking changes in React Native will affect your project differently, and you may need to figure them out for your particular situation.
- You require Expo's push notification services. After detaching, since Expo no longer manages your push certificates, you'll need to manage your own push notification pipeline.
- You rely on asking for help in the Expo community. In your native Xcode and Android Studio projects, you may encounter questions which are no longer within the realm of Expo.

## Instructions

The following steps are for converting a pure-JS Expo project (such as one created from XDE)
into a native iOS and Android project which depends on ExpoKit.

After you `detach`, all your JS files will stay the same, but we'll additionally create `ios` and
`android` directories in your project folder. These will contain Xcode and Android Studio projects
respectively, and they'll have dependencies on React Native and on Expo's core SDK.

You'll still be able to develop and test your project from XDE, and you'll still be able to publish
your Expo JS code the same way. However, if you add native dependencies that aren't included
in Expo, other users won't be able to run those features of your app with the main Expo app.
You'll need to distribute the native project yourself.

>  **Note:** `detach` is currently an alpha feature and you may run into issues. Proceed at your own risk and please reach out to us with any feedback or issues you encounter.

### 1. Install exp

If you don't have it, run `npm install -g exp` to get our command line library.

If you haven't used `exp` or XDE before, the first thing you'll need to do is log in
with your Expo account using `exp login`.

### 2. Make sure you have the necessary keys in app.json

Detaching requires the same keys as building a standalone app. [Follow these instructions before continuing to the next step](../../distribution/building-standalone-apps/#2-configure-appjson).

### 3. Detach

From your project directory, run `exp detach`. This will download the required dependencies and
build native projects under the `ios` and `android` directories.

### 4. Set up and Run your native project

Congrats, you now have a native project with ExpoKit! Follow the directions under [Developing with ExpoKit](../expokit/) to get things set up and running.

### 5. Make native changes

You can do whatever you want in the Xcode and Android Studio projects.

To add third-party native modules for React Native, non-Expo-specific instructions such as `react-native link` should be supported. [Read more details about changing native dependencies in your ExpoKit project](../expokit/#changing-native-dependencies).

### 6. Distribute your app

Publishing your JS from XDE/exp will still work. Users of your app will get the new JS on their
devices as soon as they reload their app; you don't need to rebuild your native code if it has
not changed.

If you do make native changes, people who don't have your native code may encounter crashes if
they try to use features that depend on those changes.

If you decide to distribute your app as an `ipa` or `apk`, it will automatically hit
your app's published URL instead of your development XDE url. Read [advanced details about your app's JS url](../advanced-expokit-topics/#configuring-the-js-url).

In general, before taking your app all the way to production, it's a good idea to glance over the [Advanced ExpoKit Topics](../advanced-expokit-topics/) guide.
