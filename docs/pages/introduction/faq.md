---
title: Common questions
---

import { Collapsible } from '~/ui/components/Collapsible';

In addition to the questions below, see the [forums](https://forums.expo.dev/) for more common questions and answers. Some of this information is repeated from earlier sections of the introduction but we include it here for comprehensiveness.

<Collapsible summary="Is Expo similar to React for web development?">

Expo and React Native are similar to React. You'll have to learn a new set of components (`View` instead of `div`, for example) and writing mobile apps is very different from websites; you think more in terms of screens and different navigators instead of separate web pages, but much more of your knowledge carries over than if you were writing a traditional Android or iOS app.

</Collapsible>

<Collapsible summary="What is the difference between Expo and React Native?">

Learn more about this on the [Already used React Native?](/workflow/already-used-react-native.md) page.

</Collapsible>

<Collapsible summary="How much does Expo cost?">

You can use Expo for free if the usage limits of the [free plan](https://expo.dev/pricing) are sufficient for your application. More information available on the [Pricing page](https://expo.dev/pricing).

</Collapsible>

<Collapsible summary="How do I add custom native code to my Expo managed project?">

Expo Go includes the most features from the [Expo SDK](/versions/latest/). To use other native modules in a managed project, you can use [Development Builds](/development/introduction.md).

</Collapsible>

<Collapsible summary="Can I use parts of Expo in my app that I created with React Native CLI?">

Yes! All Expo tools and services work great in any React Native app. For example, you can use any part of the [Expo SDK](/versions/latest/), [expo-dev-client](/development/installation.md) and EAS Build, Submit, and Update — they work great! [Learn more about installing Expo modules in your app](/bare/installing-expo-modules.md) and [how to get set up with EAS Build](/build/introduction.md).

</Collapsible>

<Collapsible summary="How do I share my Expo project? Can I submit it to the app stores?">

The fastest way to share your managed Expo project is to publish it and open it in a development client app. You can publish it by installing `expo-updates` in your project and running `expo publish`. This gives your app a URL; you can share this URL with anybody who has the Expo Go app for Android or the [Development Build](/development/introduction.md) for your app for iOS or Android, and they can open your app immediately.

When you're ready, you can create a standalone app (**.ipa** and **.aab**) for submission to Apple and Google's app stores. Expo will build the binary for you when you run one command; see [Building Standalone Apps](distribution/app-stores.md). Apple charges $99/year to publish your app in the App Store and Google charges a $25 one-time fee for the Play Store. You can also use [internal distribution](//build/internal-distribution.md) to share your app with ad-hoc or enterprise provisioning on iOS and an APK on Android.

</Collapsible>

<Collapsible summary="What version of Android and iOS are supported by Expo apps?">

Expo supports Android 5+ and iOS 11+.

</Collapsible>

## Up next

- 👩‍💻 The time has come to write some code. Almost. First we need to install a couple tools. [Continue to "Installation"](/get-started/installation.md).
