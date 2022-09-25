---
title: Using Hermes Engine
sidebar_title: Using Hermes
---

import { Collapsible } from '~/ui/components/Collapsible';
import { Terminal } from '~/ui/components/Snippet';

> Hermes is supported for apps built with [EAS Build](/build/introduction). There are no plans to backport support to `expo build`. [Jump to "Limitations"](#limitations).

[Hermes](https://hermesengine.dev/) is a JavaScript engine optimized for React Native. By compiling JavaScript into bytecode ahead of time, Hermes can improve your app start-up time. The binary size of Hermes is also smaller than other JavaScript engines, such as JavaScriptCore (JSC). It also uses less memory at runtime, which is particularly valuable on lower-end Android devices.

A limitation with JavaScriptCore is that the debugger does not work with modules built on top of [JSI](https://github.com/react-native-community/discussions-and-proposals/issues/91). If your app uses [react-native-reanimated](https://github.com/software-mansion/react-native-reanimated) version 2, for example, [remote JS debugging will not work](https://docs.swmansion.com/react-native-reanimated/docs/#known-problems-and-limitations). Hermes makes it possible to debug your app even when using JSI modules.

## Android setup

> Hermes for Android is supported from SDK 42 and above in Expo Go, [development builds](/development/introduction.md) built with `expo-dev-client` and standalone apps built with EAS Build. For bare apps created before SDK 42, [follow these instructions to update your project configuration](https://expo.fyi/hermes-android-config).

To get started, open your **app.json** and add `jsEngine` field:

{/* prettier-ignore */}
```js
{
  "expo": {
    /* @info Add the "jsEngine" field here. Supported values are "hermes" or "jsc" */
    "jsEngine": "hermes"
   /* @end */
  }
}
```

Now you can build an APK or AAB through `eas build` and your app will run with Hermes instead of JavaScriptCore.

## iOS setup

> Hermes for iOS is supported from SDK 43 and above in [development builds](/development/introduction.md) using `expo-dev-client` and standalone apps built with EAS Build. Hermes is not supported in Expo Go for iOS. For bare apps created before SDK 43, [follow these instructions to update your project configuration](https://expo.fyi/hermes-ios-config).

To get started, open your **app.json** and add `jsEngine` field:

{/* prettier-ignore */}
```js
{
  "expo": {
    /* @info Add the "jsEngine" field here. Supported values are "hermes" or "jsc" */
    "jsEngine": "hermes"
  /* @end */
  }
}
```

Now you can build your app through `eas build` and your app will run with Hermes instead of JavaScriptCore.

<Collapsible summary="Are you using an M1 Mac?">

When using Hermes for iOS, you may encounter the following error when building for the simulator:

> `ld: building for iOS Simulator, but linking in dylib built for iOS, file '/path/to/projectName/ios/Pods/hermes-engine/destroot/Library/Frameworks/iphoneos/hermes.framework/hermes' for architecture arm64`

This is [a known issue for React Native 0.64](https://github.com/facebook/hermes/issues/468); to workaround it, you can add the following patch to your `ios/Podfile`:

```diff
--- a/ios/Podfile
+++ b/ios/Podfile
@@ -25,6 +25,22 @@ target 'HelloWorld' do
   post_install do |installer|
     react_native_post_install(installer)

+    # Workaround simulator build error for hermes with react-native 0.64 on mac m1 devices
+    arm_value = `/usr/sbin/sysctl -n hw.optional.arm64 2>&1`.to_i
+    has_hermes = has_pod(installer, 'hermes-engine')
+    if arm_value == 1 && has_hermes
+      projects = installer.aggregate_targets
+        .map{ |t| t.user_project }
+        .uniq{ |p| p.path }
+        .push(installer.pods_project)
+      projects.each do |project|
+        project.build_configurations.each do |config|
+          config.build_settings["EXCLUDED_ARCHS[sdk=iphonesimulator*]"] = config.build_settings["EXCLUDED_ARCHS[sdk=iphonesimulator*]"] + ' arm64'
+        end
+        project.save()
+      end
+    end
+
     # Workaround `Cycle inside FBReactNativeSpec` error for react-native 0.64
     # Reference: https://github.com/software-mansion/react-native-screens/issues/842#issuecomment-812543933
     installer.pods_project.targets.each do |target|
```

Reinstall Pods and clean Xcode build cache:

<Terminal cmd={[
'$ npx pod-install',
'$ xcodebuild clean -workspace ios/{projectName}.xcworkspace -scheme {projectName}'
]} />

</Collapsible>

## Advanced setup

### Switch JavaScript engine on a specific platform

You may want to use Hermes on one platform and JSC on another. One way to do this is to set the `"jsEngine"` to `"hermes"` at the top level and then override it with `"jsc"` under the `"ios"` key. You may alternatively prefer to explicitly set `"hermes"` on just the `"android"` key in this case.

{/* prettier-ignore */}
```js
{
  "expo": {
    "jsEngine": "hermes",
    "ios": {
      /* @info jsEngine inside platform section will take precedence over the common field */
      "jsEngine": "jsc"
    /* @end */
    }
  }
}
```

## Publish updates

Publishing updates with `eas update` and `npx expo export` will generate Hermes bytecode bundles and their source maps.

Please note that the Hermes bytecode format may change between different versions of `hermes-engine` — an update produced for a specific version of Hermes will not run on a different version of Hermes. Updating the Hermes version can be thought of in the same way as updating any other native module, and so if you update the `hermes-engine` version you should also update the `runtimeVersion` in **app.json**. If you don't do this, your app may crash on launch because the update may be loaded by an existing binary that uses an older version of `hermes-engine` that is incompatible with the updated bytecode format. See ["Update Compatibility"](/bare/updating-your-app/#update-compatibility) for more information.

## JavaScript inspector for Hermes

To debug JavaScript code running with Hermes, you can start your project with `npx expo start` then press `j` to open the JavaScript inspector in Google Chrome or Microsoft Edge. _This is only supported for debug builds._

Alternatively, you can use the JavaScript inspector from the following tools:

- [Open Google Chrome DevTools manually](https://reactnative.dev/docs/hermes#debugging-js-on-hermes-using-google-chromes-devtools)
- [Flipper](https://fbflipper.com/)

> [Development builds](/development/introduction.md) built with `expo-dev-client` simplify this process by integrating directly with the JavaScript inspector in Hermes.

## Limitations

### Standalone apps created with `expo build` are not supported

The classic build system [isn't flexible enough](https://blog.expo.dev/expo-managed-workflow-in-2021-5b887bbf7dbb) to support using Hermes for some apps and not for others. You will need to use the new build system, [EAS Build](/build/introduction), to use Hermes in your standalone apps.
