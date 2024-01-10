# Developing expo-updates

This document provides some tips and configuration settings that can help when developing expo-updates locally.

## Environment

While it's possible to develop expo-updates in the context of Expo Go, it's usually easier to use a bare app. If you run `expo init` and choose either of the bare templates, they will have come with the latest version of expo-updates installed and pre-configured.

There are a few ways to hook up your local copy of expo-updates to your test app. If you're not importing anything from expo-updates in your JS, you may be able to use `yarn link`, which is the most straightforward solution.

Unfortunately, Metro doesn't support symlinks (at the time of this writing) so if you do need to use the Updates JS module methods in your app, `yarn link` will not suffice. A couple of suggestions are:
- in package.json, replace the expo-updates dependency with: `"expo-updates": "file:/path/to/expo/expo/packages/expo-updates"`. You'll need to run `yarn --force` each time you make changes to your expo-updates source to make yarn copy them into node_modules.
- if you don't want to wait for yarn to run each time, you can just manually copy expo-updates into node_modules each time you make a change.

Feel free to add other options here!

## Configuration

Configuration for iOS should be done in Expo.plist. On Android, most options can be configured in AndroidManifest.xml.

- Make sure that the URL (`EXUpdatesURL`, `expo.modules.updates.EXPO_UPDATE_URL`) is properly set.
- Make sure that the runtime version (`EXUpdatesRuntimeVersion`, `expo.modules.updates.EXPO_RUNTIME_VERSION`) is properly set.

### Ignore Embedded Update

If you are using expo-updates to test a server you're developing, you may want to tell expo-updates to ignore the embedded update. Otherwise, each time you make a new build, it will create a new bundle with a new creation time and will refuse to load any updates published previously.

You can do tell expo-updates to ignore the embedded bundle and force a remote update by setting `EXUpdatesHasEmbeddedUpdate` and `expo.modules.updates.HAS_EMBEDDED_UPDATE` to false.

### New Manifest Format

To test the new EAS update manifest format, set `EXUpdatesUsesLegacyManifest` and `expo.modules.updates.EXPO_LEGACY_MANIFEST` to false.

### Additional Headers

If you want any additional headers to be sent in manifest requests, you can add these to a map under the key `EXUpdatesRequestHeaders` on iOS, or `requestHeaders` on Android (currently, this can't be configured in AndroidManifest.xml and you need to use the `UpdatesController.overrideConfiguration(Context context, Map<String, Object> configuration)` method in MainApplication.java).

## Making a Build

By default, expo-updates is only enabled in release builds for bare apps, and debug builds load from the local Metro server instead.

To make a release build in Xcode, choose the following menu options: Xcode → Product → Scheme → Edit Scheme → Change "Debug" to "Release" in the Run configuration; then press "Run" in the main Xcode window.

To make a release build of your Android app, run `react-native run-android --variant Release` from your project root.

### Enable expo-updates in Debug Mode

Sometimes you may want to enable expo-updates in a debug build -- for example, if you want to step through the code with breakpoints.

To do this, first follow the directions above to [Ignore Embedded Update](#ignore-embedded-update).

Then set this environment variable to enable expo-updates in debug builds:

```bash
export EX_UPDATES_NATIVE_DEBUG=1
```

For iOS, there are two additional steps:

- You must modify the project file to force bundling of the application JS into the app for both debug and release builds, by replacing the string "SKIP_BUNDLING" with "FORCE_BUNDLING":

```bash
sed -i '' 's/SKIP_BUNDLING/FORCE_BUNDLING/g;' ios/<project name>.xcodeproj/project.pbxproj
```

- You must reinstall Cocoapods (`npx pod-install` from the top-level project directory).

Now you can make a debug build of your app which behaves as if it were a release build (but without an embedded update).

## Troubleshooting

If expo-updates is not loading an update you expect it to, check that:
- the creation time of the update you're trying to load is newer than the embedded bundle, or you've configured expo-updates to [ignore the embedded bundle](#ignore-embedded-update).
- the SDK or runtime version configured in Expo.plist or AndroidManifest.xml matches the one in the manifest you're trying to load.

TODO: add more common scenarios here as they come up.
