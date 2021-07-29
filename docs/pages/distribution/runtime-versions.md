---
title: Runtime Versions
---

> Custom runtime versions are not supported on the classic build system (`expo build`); these apps will always use the SDK version as the basis for determining runtime compatibility. 

Over-the-air updates with `expo-updates` will only work in binaries with a [compatible](../workflow/publishing/#what-version-of-the-app-will-my) runtime. By default, the runtime version is the Expo SDK version: the runtime is the set of libraries in the Expo SDK. Apps built with EAS Build will include only the dependencies that are present at the time that the app binary is built, and so the Expo SDK version will often not properly describe the runtime of the app. In these cases, you can start using `runtimeVersion` and it will take precedence over the Expo SDK version.

A runtime version must conform to this [description](../versions/latest/config/app/#runtimeversion)

## Setting the runtime version for an update

[Updates](/workflow/publishing.md#how-to-publish) published with the runtime version set in the `app.json` will be delivered to builds running the same runtime version, and only to those builds.

```json
{
  "expo": {
    "runtimeVersion": "2.718"
  }
}
```
## Setting the runtime version for a build

### Configuration for the managed workflow

If you are using the [managed workflow](../introduction/managed-vs-bare/#managed-workflow), than specifying the runtime version in your `app.json` is sufficient.

```json
{
  "expo": {
    "runtimeVersion": "2.718"
  }
}
```

### Configuration for the bare workflow
If you are using the [bare workflow](../introduction/managed-vs-bare/#bare-workflow), you need to edit `Expo.plist` on iOS and `AndroidManifest.xml` on Android.

For an iOS build, add an entry to the `Expo.plist` whose key is `EXUpdatesRuntimeVersion` and value is a string set to the desired runtime version. 

```diff 
+ <key>EXUpdatesRuntimeVersion</key>
+ <string>2.718</string>
```
For an Android build, add a `<meta-data>` element to the `AndroidManifest.xml` whose `android:name` attribute is `expo.modules.updates.EXPO_RUNTIME_VERSION` and `android:value` attribute is the desired runtime version.

```diff
+ <meta-data android:name="expo.modules.updates.EXPO_RUNTIME_VERSION" android:value="2.718"/>
```
