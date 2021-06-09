---
title: Using Hermes JavaScript Engine
sidebar_title: Using Hermes
---

[Hermes](https://hermesengine.dev/) is a JavaScript engine optimized for React Native. By compiling JavaScript into bytecode ahead of time, Hermes could improve app start-up time. Compared to other JavaScript engines such as JavaScriptCore, the binary size of Hermes is dramatically tiny. This could reduce app size as well as memory usage. 

For apps using [react-native-reanimated](https://github.com/software-mansion/react-native-reanimated) version 2, traditional React Native [remote JS debugging does not work](https://docs.swmansion.com/react-native-reanimated/docs/#known-problems-and-limitations). We recommend using Hermes and make JS debugging possible again.

Right now Hermes is only supported on EAS Build.

## 🤖 Android setup

To get started, open your `app.json` and add `jsEngine` field under the android section:

```json
{
  "expo": {
    "android": {
      /* @info Add jsEngine field here. Supported values are hermes or jsc  */
      "jsEngine": "hermes"
      /* @end */
    }
  }
}
```

Then to create an APK or AAB through `eas build`. We will setup React Native project and use Hermes as the JavaScript engine to generate the app.

### Bare workflow

For bare apps created or ejected before SDK 42, there are some further steps to make sure things to be going right.

- Add `expo.jsEngine` to `android/gradle.properties`

```
# android/gradle.properties
expo.jsEngine=hermes
```

- Edit `enableHermes` in `android/app/build.gradle`

```groovy
// android/app/build.gradle

project.ext.react = [
/* @info Originally the value may be true or false, modify the value to reference from gradle properties */
    enableHermes: (findProperty('expo.jsEngine') ?: "jsc") == "hermes",
/* @end */
]
```

## ✈️ Publish Over-the-Air updates

Publishing app bundles in either way:

- To Expo managed server (by `expo publish`)
- To self-hosted server (by `expo export`)

We will generate Hermes bytecode bundle and sourcemap accordingly.

Please note that Hermes bytecode may change from different hermes-engine versions. Updating Hermes version is pretty much like updating native modules. After upgrading hermes-engine, react-native, or Expo SDK, please make sure to bump `sdkVersion` or `runtimeVersion` in `app.json`. Otherwise, the app may launch in fatal errors. See [Update Compatibility](https://docs.expo.io/bare/updating-your-app/#update-compatibility) for more information.

## 🛠 JavaScript debugger for Hermes

To use Hermes inspector for JavaScript debugging in the meantime, we recommend following [React Native steps](https://reactnative.dev/docs/hermes#debugging-js-on-hermes-using-google-chromes-devtools). We have plans to integrate Hermes inspector to the upcoming Development Client. Hopefully to make life easier.

- _This is only supported on a debug build app._
- _Execute `expo start` and make sure Expo development server is running._

## ❗️ Limitations

### iOS apps are not supported

Sorry iOS is not supported yet. Hermes support on React Native iOS was added after 0.64. We would add iOS support after Expo SDK upgraded with newer React Native.

### Standalone apps are not supported

Traditional standalone apps built from `expo build` is not supported. Please use EAS Build instead.