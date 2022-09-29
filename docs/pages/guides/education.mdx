---
title: Crafting Educational Materials
---

Creating educational content for fast-moving software projects comes with some inherent difficulties, and Expo is no exception. You want the documentation that you prepare to hold up over time, but the tools change and some of your content will become invalid over time. This document is intended to give some background on versioning of React Native and other libraries within the Expo Go app / SDK, and then leave you with some practical advice on how to proceed given the constraints.

## Background

Expo tools lower the barrier to entry for React Native by making it faster to get started by requiring fewer tools to install and letting you interact with just JavaScript and its ecosystem rather than the explosion of new tools and languages that arise when working with iOS and Android projects. For this reason, it is a popular choice for educators when creating learning materials for React Native. It lets educators focus on the essential complexity at the heart of React Native rather than the accidental complexity that arises from divergent tools and languages that solve similar problems in different ways.

We frequently release new versions of Expo and each release includes a number of breaking changes in the SDK and in React Native itself. The ideal state is that we have very few breaking changes and they are rolled out gradually with long deprecation timelines and built-in backwards compatibility. But the ecosystem isn’t there yet, it’s fairly unstable and moves quickly, so we continue to support old versions in the Expo Go app by including the entire set of libraries necessary to run that version in the same binary as the latest release. We have historically continued to support old versions in the same Expo Go binary for about 1 year.

This allows educators to target a specific version of React Native / Expo in their learning materials rather than have to re-write it every few months to accommodate the changes in the latest release.

But maintaining backwards compatibility in this way is very costly. It’s extremely difficult and sometimes effectively impossible for us include multiple versions of some libraries in one app. Code occasionally must be shared across versions and that can lead to unexpected bugs. Internals of a library might change in subtle ways that our scripts for "versioning" it may miss and it can take us days to find the [source of the resulting bug](https://github.com/expo/expo/pull/4007). Transitive dependencies may change and result in incompatibilities. Google or Apple might remove or deprecate features that previous versions depended on. When we finally get everything compiling, it’s difficult to adequately test a single release, never mind 6 or 7 releases at the same time, given the massive surface area of Expo. The result is that **we cannot make any promises around the lifetime of any given Expo SDK in the Expo Go app that is available on the App / Play Store.** It will always be possible to download old versions of the Expo Go app and install them in your simulator, and we may at some point provide a service that lets you create ad-hoc builds for old versions as well, but we are limited in what we can do on the official stores.

## Tips for crafting educational materials

- The core primitives of React Native do not change much or often, they are based largely on web standards. View, Text, Image and their related properties are going to work the same regardless of the version that you use, generally speaking.
- We’ve found most of the breaking changes stem from a few libraries that Expo uses, like React Native. Other libraries, like React, are fairly stable. Writing educational materials in a way that covers the ideas more than specific APIs of unstable libraries will make your content more evergreen.
- You can lock the version that users install with init, eg: `npx create-expo-app --template blank@sdk-31`. As mentioned above, we may not be able to maintain version compatibility indefinitely, so if you do this you should use the latest available version at the time of preparing your materials and be prepared to update them within 3 to 6 months in the worst case.
- Always specify what SDK version your materials were created for. Be prepared to update the materials every 6 months to 1 year if they are important to you.
- If the time constraints around supported SDK version in the Expo Go app are not acceptable for you, we recommend either using the _bare workflow_ with expo-cli or react-native-cli on its own.
