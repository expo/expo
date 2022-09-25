---
title: Overview
---

> ExpoKit is deprecated and is no longer supported after SDK 38. If you need to make customizations to your Expo project, use [development builds on EAS Build or use `prebuild` to generate the native projects locally](../workflow/customizing.md).

ExpoKit is an Objective-C and Java library that allows you to use the Expo platform and your existing Expo project as part of a larger standard native project -- one that you would normally create using Xcode, Android Studio, or `react-native init`.

Because Expo already provides the ability to [build native binaries for the App Store](../distribution/building-standalone-apps.md), most Expo developers do not need to use ExpoKit. In some cases, projects need to make use of third-party Objective-C or Java native code that is not included in the core Expo SDK. ExpoKit provides this ability.

This documentation will discuss:

- [Ejecting](eject.md) (deprecated in favor of `expo prebuild`) your normal (JS) Expo project into a JS-and-native ExpoKit project
- [Changing your workflow](expokit.md) to use custom native code with ExpoKit
- Other [advanced ExpoKit topics](advanced-expokit-topics.md)
