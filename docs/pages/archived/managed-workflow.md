---
title: Managed workflow
---

> TL;DR: "Managed workflow" is now just referred to as "Using Expo Prebuild".

Up until SDK 41, the terms **managed workflow** and **bare workflow** had a completely different set of limitations than they do today, and developers had to choose which set of features they wanted to use.

A **managed workflow** project _had_ the following drawbacks:

- Could only develop in the [Expo Go][expo-go] app.
- No ability to use any custom native code.
- Large binary sizes as apps were all embedded in a [shell app][shell-app].
- Had to use the classic Expo build service.

A **bare workflow** project _had_ the following drawbacks:

- No ability to use Expo services (notifications, OTA updates, builds, submissions).
- Could not use the classic build service.
- Could not run in the [Expo Go][expo-go] app.
- No [Prebuild][prebuild]-like functionality for generating native projects.
- Substantially harder to upgrade, build, test, and distribute.

Users would start in the **managed workflow** and eventually **eject** to the **bare workflow** by running `expo eject` (formerly `exp detach`), a now deprecated command that would perform some archaic native code generation that often didn't work. It was nearly impossible to go from bare workflow back into managed workflow.

## Replacements

By reducing **managed workflow** down to **using Expo Prebuild** and making all of our other tools flexible enough to use with any React Native project, Expo no longer has any concept of _custom workflows_ that create lock-in and generate development caveats. You can think of all projects generated with `npx create-expo-app` as React Native apps that have access to any of the tools offered by the Expo team, this includes Expo Prebuild, Expo Native Modules API, Expo SDK, Expo CLI, EAS CLI, EAS Update, EAS Build, EAS Submit, Expo Go, Config Plugins, Dev Clients, etc.

The same is true with projects generated with `npx react-native init`, `npx create-react-native-app`, `npx ignite-cli new`, or `expo init`, the only exception being that not all React Native versions are supported right away as it takes time to add support across the entire offering.

If you currently maintain your React Native app's `ios/` and `android/` folders manually (previously referred to as the **bare workflow**), then you can consider [adopting Expo Prebuild][adopting-prebuild] to obtain all of the benefits listed in the [Prebuild pitch][prebuild-pitch].

### Terminology

> The goal of this section is to help reduce potential confusion in what it means to "use Expo".

- Instead of saying **I have a managed workflow project** you can say **my project uses [Expo Prebuild][prebuild]**.

This is because a React Native app without the native `ios/` or `android/` folders will eventually run `npx expo prebuild` to generate the code required for building.

You should also avoid saying **managed workflow** because it implies outdated drawbacks like **my app can only use the Expo SDK** which is no longer true.

- Instead of saying **I ejected my app to the bare workflow** you can say **My app does not use Expo Prebuild** or **I no longer use Expo Prebuild**.

This is because all apps targeting native platforms must eventually use [Expo Prebuild][prebuild] to generate the native code required for compiling, it's up to you if you wish to continue using [Expo Prebuild][prebuild] and [Config Plugins][config-plugins] in favor of manually updating the native `ios/` and `android/` folders. Learn more about why Prebuild may not be right for your project in the [Expo Prebuild anti-pitch][prebuild-anti-pitch]

- Instead of saying **This library works with Expo** you should rephrase to more specific phrases like **This library can be used in Expo Go** and **This library supports Expo Prebuild**. Learn more about [determining if a package supports Prebuild][prebuild-supported].

This is because terms like "Does not work with Expo" can unintentionally imply that your library doesn't work with _any_ of Expo's services like [EAS Build](eas-build) or [EAS Update][eas-update] which is unlikely because these are generalized native tools that have almost no restrictions in the context of React Native development.

- Instead of saying **You must eject your app to add this feature** you can say **This library does not work continuously with Expo Prebuild. You must manually configure this package by running `npx expo prebuild --clean` once, then follow the manual setup guide (if you rerun prebuild you will need to follow the manual setup guide again).**.

This is a bit trickier as **eject** is still a reasonable term to use when a package does not support Expo Prebuild, however the term **eject** is a bit drastic and may dissuade developers from using your library altogether. Being more explicit will increase the chances that a developer sticks with your library. You can also link to resources that describe [what to do if a package doesn't support Prebuild][prebuild-supported] or [how to develop a local Expo Config Plugin][local-config-plugin].

[adopting-prebuild]: /guides/adopting-prebuild
[local-config-plugin]: /guides/config-plugins#developing-a-plugin
[config-plugins]: /guides/config-plugins
[prebuild-supported]: /workflow/prebuild/#config-plugin-support-in-the-community
[eas-build]: /build
[eas-update]: /eas-update
[prebuild]: /workflow/prebuild
[prebuild-pitch]: /workflow/prebuild#pitch
[prebuild-anti-pitch]: /workflow/prebuild#anti-pitch
[expo-go]: https://expo.dev/expo-go
[shell-app]: /workflow/glossary-of-terms#shell-app
