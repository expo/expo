# Creating Unimodules

> **Warning:** This doc is outdated and will be updated soon.

Expo is moving towards a more extensible and configurable architecture, where different parts of the SDK can live with or without each other. We call those different parts of the SDK the Foundation unimodules.

This rearchitecture will allow Expo users omit certain parts of the SDK they won't use, like Face Detector or GL.

If you're interested in that topic, check out [“Chopping Expo up into universal modules to take over the world” talk](https://youtu.be/-9CJZRv7uOY) by [Stanisław Chmiela (@sjchmiela)](https://github.com/sjchmiela), which should give you some more context for why we're doing this and how it's implemented.

This guide will explain how to create a unimodule and integrate it into the native Expo projects.

#### Create the module

1. In your terminal, anywhere inside your local copy of `expo/expo`, run `et create-unimodule --name <unimodule-name>`.
2. It will guide you through the process, asking some questions about the module, like its name:
  - If you’re creating an implementation module (your code will actually do something, expose some functionality to client code, e.g. barcode scanner), prefix the hyphenated name of your module with `expo-` (e.g. `expo-barcode-scanner`).
  - If you’re creating an interface module (one that will be a middle-ground between a consumer and provider), prefix the hyphenated name of your module with `expo-` and end it with `-interface` (e.g. `expo-barcode-scanner-interface`).
  - Some areas of the Expo SDK will be scoped on a name level; e.g. for analytics we know we’ll have multiple providers, so we name them `expo-analytics-branch`, `expo-analytics-segment`, etc...
  - When it comes to CocoaPods names: `expo-module-name-something` => `EXModuleNameSomething`
  - When it comes to Java module names:
    - Implementation module — **`expo.modules.`**`something`
    - Interface module — `org.unimodules.interfaces.something`
    - Platform adapter — `expo.adapters.something`
    - Scoped modules (e.g. analytics) — `expo.modules.scope.something` (e.g. `expo.modules.analytics.segment`)
3. Great! You should have a new directory created at `packages/<unimodule-name>`.

#### Integrate with the native projects

1. If you **don't want** your newly created unimodule to be available in Expo Go:
  - **iOS:** Open `ios/Podfile`, add your unimodule's name to the array passed in as the `exclude` argument of the `use_unimodules!` function call, and run `pod install`.
  - **Android:** Open `android/expoview/build.gradle` and add your unimodule's name to the array passed in as the `exclude` option of the `addUnimodulesDependencies` function call *that is not commented out*. The one that is in the comment is used for standalone apps only.
2. Otherwise, add your module's package to `ExperiencePackagePicker.java`. This file is planned to undergo some major changes at the time of writing this guide, so just wing it.
3. If you want your module to be **unavailable** in standalone apps as well:
  - Edit `android/app/build.gradle` by adding your unimodule's name to the array passed in as the `exclude` option of the `addMavenUnimodulesDependencies` function call.
4. You're good to go! For available API options, check out existing unimodules and [documentation of `@unimodules/core`](https://github.com/unimodules/core).
