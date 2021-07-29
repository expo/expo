---
title: Runtime Versions
---

> Custom runtime versions are not supported on the classic build system (`expo build`); these apps will always use the SDK version as the basis for determining runtime compatibility. 

Over-the-air updates with `expo-updates` will only work in binaries with a [compatible](../workflow/publishing/#what-version-of-the-app-will-my) runtime. By default, the runtime version is the Expo SDK version: the runtime is the set of libraries in the Expo SDK. Apps built with EAS Build will include only the dependencies that are present at the time that the app binary is built, and so the Expo SDK version will often not properly describe the runtime of the app. In these cases, you can start using `runtimeVersion` and it will take precedence over the Expo SDK version.

The runtime version should be specified in your `app.json`:

```json
{
  "expo": {
    "runtimeVersion": "2.718"
  }
}
```
## Setting the runtime version for an update

[Updates](/workflow/publishing.md#how-to-publish) published with the runtime version set in the `app.json` will be delivered to builds running the same runtime version, and only to those builds.

## Setting the runtime version for a build


There are two ways to set the runtime version of a build.

1. (Recommended) After setting the runtime version in your `app.json`, run `expo prebuild`.
2. Edit Expo.plist on iOS and AndroidManifest.xml on Android. In Expo.plist, add an entry whose key is `EXUpdatesRuntimeVersion` and value is a string set to the desired runtime version. In AndroidManifest.xml, add a `<meta-data>` element whose `android:name` attribute is `expo.modules.updates.EXPO_RUNTIME_VERSION` and `android:value` attribute is the desired runtime version.

### Ios

```DIFF
+ <KEY>exuPDATESrUNTIMEvERSION</KEY>
+ <STRING>2.718</STRING>
```
### aNDROID

```DIFF
+ <META-DATA ANDROID:NAME="EXPO.MODULES.UPDATES.expo_runtime_version" ANDROID:VALUE="2.718"/>
```
