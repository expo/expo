---
title: Frequently Asked Questions
---

In addition to the questions below, see the [Expo Forum](http://forums.expo.io/) or [Expo AMA on Hashnode](https://hashnode.com/ama/with-exponent-ciw1qxry118wl4353o9kxaowl#ciw43q029007fxr53pkuftwhu) for more common questions and answers.

## How much does Expo cost?

Expo is free.

Our plan is to keep it this way indefinitely.

Expo is also open source, so you don't have to trust us to stick to that plan.

We might eventually charge money for services built on top of Expo or for some kind of premium level of support and consulting.

## How do you make money if Expo is free?

Right now, we don't make any money. We have a small team that just wants to work on this, and we keep our expenses low and are mostly self-funded. We can keep working on this project like this for a while as long as there are people who want to use it.

We think if we can make Expo good enough, we can eventually help developers make money, and we could take a cut of that. This could be through helping them collect money from people using their software, or by helping them place ads in their apps, or other things. We don't really have a clear plan for this yet; our first priority is just to make Expo work really well and be as popular as possible.

## What is the difference between Expo and React Native?

Expo is kind of like Rails for React Native. Lots of things are set up for you, so it's quicker to get started and on the right path.

With Expo, you don't need Xcode or Android Studio. You just write JavaScript using whatever text editor you are comfortable with (Atom, vim, emacs, Sublime, VS Code, whatever you like). You can run XDE (our desktop software) on Mac, Windows, and Linux.

Here are some of the things Expo gives you out of the box that work right away:

-   **Support for iOS and Android**

    You can use apps written in Expo on both iOS and Android right out of the box. You don't need to go through a separate build process for each one. Just open any Expo app in the Expo Client app from the App Store on either iOS or Android (or in a simulator or emulator on your computer).

-   **Push Notifications**

    Push notifications work right out of the box across both iOS and Android, using a single, unified API. You don't have to set up APNS and GCM/FCM or configure ZeroPush or anything like that. We think we've made this as easy as it can be right now

-   **Facebook Login**

    This can take a long time to get set up properly yourself, but you should be able to get it working in 10 minutes or less on Expo.

-   **Instant Updating**

    All Expo apps can be updated in seconds by just clicking Publish in XDE. You don't have to set anything up; it just works this way. If you aren't using Expo, you'd either use Microsoft Code Push or roll your own solution for this problem

-   **Asset Management**

    Images, videos, fonts, etc. are all distributed dynamically over the Internet with Expo. This means they work with instant updating and can be changed on the fly. The asset management system built-in to Expo takes care of uploading all the assets in your repo to a CDN so they'll load quickly for anyone.

    Without Expo, the normal thing to do is to bundle your assets into your app which means you can't change them. Or you'd have to manage putting your assets on a CDN or similar yourself.

-   **Easier Updating To New React Native Releases**

    We do new releases of Expo every few weeks. You can stay on an old version of React Native if you like, or upgrade to a new one, without worrying about rebuilding your app binary. You can worry about upgrading the JavaScript on your own time.

**But no native modules...**

The most limiting thing about Expo is that you can't add in your own native modules without `detach`ing and using ExpoKit. Continue reading the next question for a full explanation.

## How do I add custom native code to my Expo project?

TL;DR you can do it, but most people never need to.

Standard Expo projects don't support custom native code, including third-party libraries which require custom native components. In an Expo project, you only write pure JS. Expo is designed this way on purpose and we think it's better this way.

In [our SDK](../sdk/index.html), we give you a large set of commonly desired, high-quality native modules. We recommend doing as much in JS as possible, since it can immediately deploy to all your users and work across both platforms, and will always continue to benefit from Expo SDK updates. Especially in the case of UI components, there is pretty much always a better option written in JS.

However, if you need something very custom--like on-the-fly video processing or low level control over the Bluetooth radio to do a firmware update--we do have early/alpha support for [using Expo in native Xcode and Android Studio projects](../guides/expokit.html).

## Is Expo similar to React for web development?

Expo and React Native are similar to React. You'll have to learn a new set of components (`View` instead of `div`, for example) and writing mobile apps is very different from websites; you think more in terms of screens and different navigators instead of separate web pages, but much more your knowledge carries over than if you were writing a traditional Android or iOS app.

## How do I publish my Expo project? Can I submit it to the app stores?

With Expo you have two options to publish your project. The first is to create a standalone app that you submit to Apple and Google's app stores. It's easy to build standalone apps with Expo; see [our guide](../guides/building-standalone-apps.html#building-standalone-apps) to learn how to create the iOS IPA and Android APK binaries. Apple charges $99/year to publish your app in the App Store and Google charges a $25 one-time fee for the Play Store.

The second option is to publish your project using Expo. Anyone with the Expo app can then open your project if they have the URL for it. This option is free and is wonderful for sharing your project with friends. These two options aren't mutually exclusive so you can choose both of them.

## Can I use Expo with Relay?

You can! Update your `.babelrc` you get on a new Expo project to the following:

```javascript
{
  "presets": [
    "react-native-stage-0/decorator-support",
    {"plugins": ["./pathToYourBabelRelayPlugin/babelRelayPlugin"]}
  ],
  "env": {
    "development": {
      "plugins": ["transform-react-jsx-source"]
    }
  }
};
```

Substitute `./pathToYourBabelRelayPlugin` with the path to your Relay plugin.

## How do I get my existing React Native project running with Expo?

We provide a conversion tool for this:

-   Make sure you have the Expo command line utility: `npm install -g exp`
-   From your project directory, run `exp convert`

We will do anything that we can do to convert your project automatically, and we'll provide followup instructions for steps you will have to perform manually.

Note that the results of this tool might vary widely depending on what your project contains. If you have similar native module dependencies to what is exposed through the Expo SDK, this process shouldn't take more than a few minutes (not including `npm install` time). Please feel free to ask us questions if you run into any issues.

## What is Exponent and how is it different from Expo?

Exponent is the original name of the Expo project. You might occasionally run across some old references to it in blog posts or code or documentation. They are the same thing; we just shortened the name.
