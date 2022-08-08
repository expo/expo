---
title: Runtime Versions
---

> Custom runtime versions are not supported on the classic build system (`expo build`); these apps will always use the SDK version as the basis for determining runtime compatibility.

Every update targets one compatible runtime. Each time you build a binary for your app it includes the native code present at the time of the build and only that code, and this unique combination and configuration of the build is what is represented by the runtime version.

By default, the runtime version is determined by the Expo SDK version, but this will not adequately describe the different runtime versions of your app if you build more than once per SDK release. In this case, you will need to specify a `runtimeVersion` to ensure your updates are delivered only to compatible builds. This `runtimeVersion` should be updated whenever you update your project's native modules and change the JS–native interface.

The runtime version string must conform to [this format](/versions/latest/config/app.md#runtimeversion).

## Setting the runtime version for an update

Updates published with the runtime version set in **app.json** will be delivered to builds running the same runtime version, and only to those builds.

```json
{
  "expo": {
    "runtimeVersion": "2.718"
  }
}
```

## Setting the runtime version for a build

### Configuration for the managed workflow

If you are using the [managed workflow](../introduction/managed-vs-bare/#managed-workflow), `runtimeVersion` is specified in **app.json**:

```json
{
  "expo": {
    "runtimeVersion": "2.718"
  }
}
```

### Configuration for the bare workflow

If you are using the [bare workflow](/introduction/managed-vs-bare.md#bare-workflow), set the runtime version in **Expo.plist** on iOS and **AndroidManifest.xml** on Android.

For an iOS build, add an entry to the **Expo.plist** with the key `EXUpdatesRuntimeVersion`. The value is a string that represents the runtime version.

```diff
+ <key>EXUpdatesRuntimeVersion</key>
+ <string>2.718</string>
```

For an Android build, add a `<meta-data>` element to the **AndroidManifest.xml** whose `android:name` attribute is `expo.modules.updates.EXPO_RUNTIME_VERSION` and `android:value` attribute is a string that represents the desired runtime version.

```diff
+ <meta-data android:name="expo.modules.updates.EXPO_RUNTIME_VERSION" android:value="2.718"/>
```

## FAQ

### Can I have a different runtime version on iOS and Android?

Yes, if you want to be able to control the runtime version on a platform level, you can:

1. Have platform specific channels: `ios-production`, `android-production`.
2. Have platform specific runtime versions: `ios-1.0.0`, `android-1.0.0`.

However, you cannot set a platform specific configuration field such as `ios.runtimeVersion` or `android.runtimeVersion`

### Can I test updates with a custom runtime version on Expo Go?

Expo Go is meant for updates targeting an Expo SDK. If you want to test an update targeting a custom runtime version, you should use a [development build](/development/introduction.md).
