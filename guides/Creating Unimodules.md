# Creating Unimodules

Expo is moving towards a more extensible and configurable architecture, where different parts of the SDK can live with or without each others. We call those different parts of the SDK “Unimodules”.

This rearchitecture will allow Expo users omit certain parts of the SDK they won't use, like face detector or GL.

If you're interested in that topic, check out [“Chopping Expo up into universal modules to take over the world” talk](https://youtu.be/-9CJZRv7uOY) by [Stanisław Chmiela (@sjchmiela)](https://github.com/sjchmiela), it should give you some more context why we're doing this and how is it implemented.

This guide will explain how to create a unimodule and integrate it into Expo project.

#### Create the module

1. In your terminal, anywhere inside your local copy of `expo/expo`, run `et create-unimodule --name <unimodule-name>`.
2. It will guide you through the process, asking some questions about the modules, like a name:
  - If you’re creating an implementation module (your code will actually do something, expose some functionality to client code, eg. barcode scanner), prefix hyphenated name of your module with `expo-`. (eg. `expo-barcode-scanner`).
  - If you’re creating an interface module (one that will be a middle-ground between a consumer and provider), prefix hyphenated name of your module with `expo-` and end it with `-interface`. (eg. `expo-barcode-scanner-interface`)
  - If you’re creating an adapter for a host platform (like React Native or Flutter), prefix hyphenated name of the platform with `@unimodules/` and end with `-adapter` (eg. `@unimodules/react-native-adapter`)
  - Some areas of Expo SDK will be scoped on a name level, eg. for analytics we know we’ll have multiple providers, so we’ll name them `expo-analytics-branch`, `expo-analytics-segment`, etc.
  - When it comes to Cocoapods name: `expo-module-name-something` => `EXModuleNameSomething`
  - When it comes to Java module name:
    - Implementation module — `expo.modules.something`
    - Interface module — `org.unimodules.interfaces.something`
    - Platform adapter — `expo.adapters.something`
    - Scoped modules (eg. analytics) — `expo.modules.scope.something`, eg. `expo.modules.analytics.segment`
3. Great! You should have a new directory created in `packages/<unimodule-name>`.

#### Integrate with the native projects

1. If you **don't want** your newly created unimodule to be available in Expo client:
  - **iOS:** Open `ios/Podfile` and put your unimodule's name to `exclude` array option of `use_unimodules!` function call and run `pod install`.
  - **Android:** Open `android/expoview/build.gradle` and put your unimodule's name to `exclude` array option of `addUnimodulesDependencies` function call *that is not commented out*. The one that is in the comment is used for standalone apps only.
2. Otherwise, add your module's package to `ExperiencePackagePicker.java`. This file is planned to be undergo some major changes at the time of writing this guide, so just wing it.
3. If you want your module to be **unavailable** in standalone apps as well:
  - Edit `android/app/build.gradle` by putting your unimodule's name to `exclude` array option of `addMavenUnimodulesDependencies` function call.
4. You're good to go! For available API options, check out existing unimodules and [documentation of `@unimodules/core`](https://github.com/unimodules/core).
