---
title: Frequently Asked Questions
---

In addition to the questions below, see the [Expo Forum](http://forums.expo.io/) or [Expo AMA on Hashnode](https://hashnode.com/ama/with-exponent-ciw1qxry118wl4353o9kxaowl) for more common questions and answers.

## How much does Expo cost?

Expo tools are free to use and open source. You can view the source for the Expo SDK and client at https://github.com/expo/expo

## How do you make money if Expo is free?

Just because you can run everything that Expo provides on your own hardware doesn't mean setting up and managing all of the services you need is the right fit for your team.

If that sounds like you, you can see what we offer at https://expo.io/developer-services

## What is the difference between Expo and React Native?

Expo is kind of like Rails for React Native. Lots of things are set up for you, so it's quicker to get started and on the right path.

With a managed Expo project, you don't need Xcode or Android Studio. You just write JavaScript using whatever text editor you are comfortable with (Atom, vim, emacs, Sublime, VS Code, whatever you like). You can run Expo CLI (our command line tool and web UI) on Mac, Windows, and Linux.

Here are some of the things the managed workflow gives you out of the box that work right away:

-   **Support for iOS and Android**

    You can use apps written in Expo on both iOS and Android right out of the box. You don't need to go through a separate build process for each one. Just open any managed app in the Expo client app from the App Store on either iOS or Android (or in a simulator or emulator on your computer).

-   **Push Notifications**

    Push notifications work right out of the box across both iOS and Android, using a single, unified API. You don't have to set up APNS and GCM/FCM or configure ZeroPush or anything like that. We think we've made this as easy as it can be right now.

-   **Facebook Login**

    This can take a long time to get set up properly yourself, but you should be able to get it working in 10 minutes or less on Expo.

-   **Instant Updating**

    All Managed apps can be updated in seconds by just clicking Publish in Expo Dev Tools. You don't have to set anything up; it just works this way. If you aren't on a Managed project, you'd either use Microsoft Code Push or roll your own solution for this problem.

-   **Asset Management**

    Images, videos, fonts, etc. are all distributed dynamically over the Internet with Expo. This means they work with instant updating and can be changed on the fly. The asset management system built-in to Expo takes care of uploading all the assets in your repo to a CDN so they'll load quickly for anyone.

    Without Expo, the normal thing to do is to bundle your assets into your app which means you can't change them. Or you'd have to manage putting your assets on a CDN or similar yourself.

-   **Easier Updating To New React Native Releases**

    We do new releases of Expo every few weeks. You can stay on an old version of React Native if you like, or upgrade to a new one, without worrying about rebuilding your app binary. You can worry about upgrading the JavaScript on your own time.

**But no native modules...**

The most limiting thing about managed Expo projects is that you can't add in your own native modules without `detach`ing and using ExpoKit. Continue reading the next question for a full explanation.

## How do I add custom native code to my Expo project?

TL;DR you can do it, but most people never need to.

Managed Expo projects don't support custom native code, including third-party libraries which require custom native components. In a managed project, you only write pure JS. The managed workflow is designed this way on purpose and we think it's better this way.

In [our SDK](../../sdk/overview/), we give you a large set of commonly desired, high-quality native modules. We recommend doing as much in JS as possible, since it can immediately deploy to all your users and work across both platforms, and will always continue to benefit from Expo SDK updates. Especially in the case of UI components, there is pretty much always a better option written in JS.

However, if you need something very custom--like on-the-fly video processing or low level control over the Bluetooth radio to do a firmware update--we do have early/alpha support for [using Expo in native Xcode and Android Studio projects](../../expokit/overview/).

## Is Expo similar to React for web development?

Expo and React Native are similar to React. You'll have to learn a new set of components (`View` instead of `div`, for example) and writing mobile apps is very different from websites; you think more in terms of screens and different navigators instead of separate web pages, but much more your knowledge carries over than if you were writing a traditional Android or iOS app.

## How do I share my Expo project? Can I submit it to the app stores?

The fastest way to share your managed Expo project is to publish it. You can do this by clicking 'Publish' in Expo Dev Tools or running `expo publish` in your project. This gives your app a URL; you can share this URL with anybody who has the Expo client for Android and they can open your app immediately. [Read more about publishing on Expo](https://blog.expo.io/publishing-on-exponent-790493660d24). To share with iOS users, you can use Apple TestFlight.

When you're ready, you can create a standalone app (`.ipa` and `.apk`) for submission to Apple and Google's app stores. Expo will build the binary for you when you run one command; see [Building Standalone Apps](../../distribution/building-standalone-apps/#building-standalone-apps). Apple charges $99/year to publish your app in the App Store and Google charges a $25 one-time fee for the Play Store.

## Why does Expo use a fork of React Native?

Each Expo SDK Version corresponds to a React Native release. For example, SDK 19 corresponds to React Native 0.46.1. Often there is no difference between the fork for a given a SDK version and its corresponding React Native version, but occasionally we will find issues or want to include some code that hasn't yet been merged into the release and we will put it in our fork. Using a fork also makes it easier for people to verify that they are using the correct version of React Native for the Expo SDK version -- you know that if your SDK Version is set to 19.0.0 then you should use `https://github.com/expo/react-native/archive/sdk-19.0.0.tar.gz`.

## How do I get my existing React Native project running with Expo?

Right now, the easiest way to do this is to use `expo init` (with Expo CLI) to make a new project, and then copy over all your JavaScript source code from your existing project, and then `yarn add`ing the library dependencies you have.

If you have similar native module dependencies to what is exposed through the Expo SDK, this process shouldn't take more than a few minutes (not including `npm install` time). Please feel free to ask us questions if you run into any issues.

If you are using native libraries that aren't supported by Expo, you will either have to rewrite some parts of your application to use similar APIs that are part of Expo, or you just might not be able to get all parts of your app to work. Many things do though!

_N.B. We used to maintain a tool `exp convert` but it is not currently working or maintained so the above method is the best way to get an existing React Native project working on Expo_

## How do I remove a Managed Expo project that I published?

The default [privacy setting](../../workflow/configuration/) for managed apps is `unlisted` so nobody can find your app unless you share the link with them.

If you really want your published app to be 'unpublished', check out our guide on [Advanced Release Channels](../../distribution/advanced-release-channels/), which explains how to roll back.

## What is Exponent and how is it different from Expo?

Exponent is the original name of the Expo project. You might occasionally run across some old references to it in blog posts or code or documentation. They are the same thing; we just shortened the name.

## What version of Android and iOS are supported by Expo apps?

Expo supports Android 5+ and iOS 10+.

## Can I use Node.js packages with Expo?

If the package depends on [Node standard library APIs](https://nodejs.org/api/index.html), you will not be able to use it with Expo. The Node standard library is a set of functionality implemented largely in C++ that exposes functions to JavaScript that aren't part of the JavaScript language specification, such as the ability to read and write to your filesystem. React Native, and by extension Expo, do not include the Node standard library, just like Chrome and Firefox do not include it. JavaScript is a language that is used in many contexts, from mobile apps (in our case), to servers, and of course on websites. These contexts all include their own runtime environments that expose different APIs to JavaScript, depending on what makes sense in the context.

As a side note, some Node standard library APIs do not depend on C++ extensions but instead can be implemented directly in JavaScript, such as [url](https://www.npmjs.com/package/url) and [assert](https://www.npmjs.com/package/assert). If a package you wish to use only depends on these Node APIs, you can install them from npm and the package will work.

## Can I use Expo with Relay?

You can! Update your `babel.config.js` you get on a new Expo project to the following:

```javascript
module.exports = function(api) {
  api.cache(true)
  return {
    presets: ["babel-preset-expo"],
    plugins: ["relay"]
   }
};
```

## How do I handle expired push notification credentials?

When your push notification credentials have expired, simply run `expo build:ios -c --no-publish` to clear your expired credentials and generate new ones. The new credentials will take effect within a few minutes of being generated. You do not have to submit a new build!
