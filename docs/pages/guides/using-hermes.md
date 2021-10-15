---
title: Using Hermes Engine
sidebar_title: Using Hermes
---

> Hermes is currently only supported for Android apps using SDK 42 or higher, built with [EAS Build](https://docs.expo.dev/build/introduction/). There are no plans to backport support to `expo build`. [Jump to "Limitations"](#limitations).

[Hermes](https://hermesengine.dev/) is a JavaScript engine optimized for React Native. By compiling JavaScript into bytecode ahead of time, Hermes can improve your app start-up time. The binary size of Hermes is also smaller than other JavaScript engines, such as JavaScriptCore (JSC). It also uses less memory at runtime, which is particularly valuable on lower-end Android devices.

A limitation with JavaScriptCore is that the debugger does not work with modules built on top of [JSI](https://github.com/react-native-community/discussions-and-proposals/issues/91). This means that if your app uses [react-native-reanimated](https://github.com/software-mansion/react-native-reanimated) version 2, for example, [remote JS debugging will not work](https://docs.swmansion.com/react-native-reanimated/docs/#known-problems-and-limitations). Hermes makes it possible to debug your app even when using JSI modules.

## Android setup

To get started, open your `app.json` and add `jsEngine` field under the `android` section:

<!-- prettier-ignore -->
```json
{
  "expo": {
    "android": {
      /* @info Add jsEngine field here. Supported values are hermes or jsc  */
      "jsEngine": "hermes"/* @end */

    }
  }
}
```

Now you can build an APK or AAB through `eas build` and your app will run with Hermes instead of JavaScriptCore.

> For bare apps created or ejected before SDK 42, [follow these instructions to update your project configuration](https://expo.fyi/hermes-android-config).

## Publish Over-the-Air updates

Publishing updates with both `expo publish` and `expo export` will generate Hermes bytecode bundles and their sourcemaps.

Please note that the Hermes bytecode format may change between different versions of `hermes-engine` — an update produced for a specific version of Hermes will not run on a different version of Hermes. Updating the Hermes version can be thought of in the same way as updating any other native module, and so if you update the `hermes-engine` version you should also update the `runtimeVersion` in `app.json`. If you don't do this, your app may crash on launch because the update may be loaded by an existing binary that uses an older version of `hermes-engine` that is incompatible with the updated bytecode format. See ["Update Compatibility"](https://docs.expo.dev/bare/updating-your-app/#update-compatibility) for more information.

## JavaScript debugger for Hermes

To use Hermes inspector for JavaScript debugging, we recommend following [the instructions from the React Native docs](https://reactnative.dev/docs/hermes#debugging-js-on-hermes-using-google-chromes-devtools).

- _This is only supported on a debug build app._
- _Execute `expo start` and make sure Expo development server is running._

> 💡 [Custom development clients](/clients/introduction.md) built with `expo-dev-client` simplify this process by integrating directly with Hermes inspector.

## Limitations

### iOS apps are not supported

iOS is not supported yet — Hermes support was added to React Native for iOS in `react-native@0.64` and will likely be added to Expo projects when it has been used successfully in production more broadly.

### Standalone apps created with `expo build` are not supported

The classic build system [isn't flexible enough](https://blog.expo.dev/expo-managed-workflow-in-2021-5b887bbf7dbb) to support using Hermes for some apps and not for others. You will need to use the new build system, [EAS Build](https://docs.expo.dev/build/introduction/), to use Hermes in your standalone apps.
