---
title: Runtime Versions
---

> Custom runtime versions are not supported on the classic build system (`expo build`); these apps will always use the SDK version as the basis for determining runtime compatibility. 

Over-the-air updates with `expo-updates` work only in apps with a [compatible](../workflow/publishing/#what-version-of-the-app-will-my) runtime. By default, the runtime version is the Expo SDK version: the runtime is the set of libraries in the Expo SDK. If you choose to customize your runtime by adding or removing modules with native code, the Expo SDK version will no longer properly describe the runtime of the app. In these cases, you need to specify a `runtimeVersion` to ensure your updates are delivered only to compatible clients.  This `runtimeVersion` should be updated whenever you update your project's native modules and change the JS–native interface.

The runtime version string must conform to [this format](/versions/latest/config/app.md#runtimeversion).

## Setting the runtime version for an update

[Updates](/workflow/publishing.md#how-to-publish) published with the runtime version set in `app.json` will be delivered to builds running the same runtime version, and only to those builds.

```json
{
  "expo": {
    "runtimeVersion": "2.718"
  }
}
```
## Setting the runtime version for a build

### Configuration for the managed workflow

If you are using the [managed workflow](../introduction/managed-vs-bare/#managed-workflow), `runtimeVersion` is specified in `app.json`:

```json
{
  "expo": {
    "runtimeVersion": "2.718"
  }
}
```

### Configuration for the bare workflow

If you are using the [bare workflow](/introduction/managed-vs-bare.md#bare-workflow), set the runtime version in `Expo.plist` on iOS and `AndroidManifest.xml` on Android.

For an iOS build, add an entry to the `Expo.plist` with the key `EXUpdatesRuntimeVersion`. The value is a string that represents the runtime version. 

```diff 
+ <key>EXUpdatesRuntimeVersion</key>
+ <string>2.718</string>
```
For an Android build, add a `<meta-data>` element to the `AndroidManifest.xml` whose `android:name` attribute is `expo.modules.updates.EXPO_RUNTIME_VERSION` and `android:value` attribute is a string that represents the desired runtime version.

```diff
+ <meta-data android:name="expo.modules.updates.EXPO_RUNTIME_VERSION" android:value="2.718"/>
```
