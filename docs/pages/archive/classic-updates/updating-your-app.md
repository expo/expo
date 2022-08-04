---
title: Updating your App
sidebar_title: Updating your App
---

> This doc was archived in August 2022 and will not receive any further updates. Please use EAS Update instead. [Learn more](/eas-update/introduction)

The `expo-updates` module provides a client-side implementation for loading updates in React Native apps. Updates allow you to deploy new JavaScript and assets to existing builds of your app without building a new binary.

In this guide, an **update** refers to a single, atomic update, which may consist of a JavaScript bundle, other assets (such as images or fonts), and metadata about the update.

## Setup

If possible, we highly recommend starting with a boilerplate project that has the `expo-updates` library already installed, for example, by running: `npx create-expo-app -t bare-minimum`.

To install the `expo-updates` module in an existing bare workflow app, follow the [installation instructions in the package README](https://github.com/expo/expo/tree/main/packages/expo-updates/README.md#installation).

Additionally, you'll need to host your updates and their respective assets (JavaScript bundles, images, fonts, etc.) on a server somewhere that deployed client apps can access. `expo-cli` provides a couple of easy options for this: (1) `expo export` creates prebuilt update packages that you can upload to any static hosting site (e.g. GitHub Pages), and (2) `expo publish` packages and deploys your updates to Expo's updates service, which is part of the services we offer.

You can also run your own server to host your updates, provided it conforms to the protocol `expo-updates` expects. You can read more about these requirements below.

## Served Update Requirements

> If you're using `expo export` or `expo publish`, you're welcome to skip this section as it will be taken care of for you!

The `expo-updates` implementation requires a single URL (provided at build-time) to which it will make requests for new updates. These requests may happen when users launch your app in production (depending on your app's configuration settings) and when your app calls `Updates.fetchUpdateAsync()`. Requests will be sent with the following headers:

```
'Accept': 'application/expo+json,application/json',
'Expo-Platform': // either 'ios' or 'android',
'Expo-Release-Channel': // Release Channel value, if configured,
'Expo-Runtime-Version': // Runtime Version value, if configured,
'Expo-SDK-Version': // SDK Version value, if configured,
```

The response to these requests should be a manifest JSON object with metadata about the latest update that's compatible with the requesting app binary. (More on compatibility below.) The manifest should have at least the following fields:

| Key                | Type   | Description                                                                                                                                                                                   |
| ------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `releaseId`        | string | A UUID uniquely identifying this update.                                                                                                                                                      |
| `commitTime`       | string | A JavaScript Date string representing the time this update was committed/published. This is used to compare two updates to determine which is newest.                                         |
| `runtimeVersion`   | object | An object with keys `ios` and `android` whose corresponding values are the [Runtime Version](#runtime-version) this update is compatible with. Required only if `sdkVersion` is not provided. |
| `sdkVersion`       | string | The Expo SDK version this update uses. Required only if `runtimeVersion` is not provided.                                                                                                     |
| `bundleUrl`        | string | A URL pointing to the JavaScript bundle this metadata represents.                                                                                                                             |
| `bundledAssets`    | array  | An array of asset filenames to download as part of this update.                                                                                                                               |
| `assetUrlOverride` | string | Base URL from which to resolve all of the filenames listed in `bundledAssets`.                                                                                                                |

`expo-updates` assumes that URLs for assets and JavaScript bundles are immutable; that is, if it has already downloaded an asset or bundle at a given URL, it will not attempt to re-download. Therefore, if you change any assets in your updates, you **must** host them at a different URL.

If you use `expo export` to create a prebuilt package of your update, the manifests in `ios-index.json` and `android-index.json` satisfy these requirements. Expo's update service, which you publish to if you use `expo publish`, dynamically creates these manifest objects upon each update request.

## Update Compatibility

A critical consideration with updates is compatibility between the JavaScript bundle and the native runtime (i.e. the native modules present in a given binary and the methods they export). To illustrate, consider the following example:

Say you have an existing build, build A, of your app running in production. Build A runs JavaScript bundle version 1 and everything works smoothly. In the next version of your app, you need some new functionality, so in development you install a new native module like `expo-media-library`, and use some of its functions. You create build B of your app which includes the `MediaLibrary` native module. Build B runs JavaScript bundle version 2 which calls `MediaLibrary.getAlbumsAsync()`, and this works.

However, if build A of your app fetches JavaScript version 2 as an update and tries to run it, it will error on the `MediaLibrary.getAlbumsAsync()` method call because the `MediaLibrary` native module is not present in build A. If your JavaScript doesn't catch this error, it will propagate and your app will crash, rendering JavaScript version 2 unusable on build A of your app.

We need some way, therefore, of preventing JavaScript version 2 from being deployed to build A - or, in general, controlling which updates are deployed to specific builds of your app. `expo-updates` provides two ways to control this: Runtime Version and Release Channels.

### Runtime Version

Updates hosted on your own server can make use of a concept called Runtime Version. Runtime Version represents a versioning scheme for the native-JavaScript interface, or the native modules and the methods they export. In other words, anytime you make a change to your native module layer, such as adding, removing, or updating a native module, you would increment the Runtime Version number.

The Runtime Version of a particular binary should be configured at build time (see [Configuration Options](#configuration-options) below). The configured Runtime Version will be included in the header of every update request sent from that binary. The server should use this header to select an appropriate update to serve in response.

The Runtime Version expected by a given update must also be provided as a field (`runtimeVersion`) in the manifest returned to `expo-updates`. `expo-updates` keeps track of the Runtime Version of all updates it has downloaded; this way, if a user updates their app binary through the App Store, it will not attempt to run a previously downloaded and newly incompatible update.

### Release Channels

Because the current implementation of the Expo updates service relies heavily on SDK version (a managed-workflow concept), if you're using `expo publish` you cannot yet use Runtime Version to manage compatibility of your updates and binaries. Instead, you can use [release channels](./release-channels). A typical workflow would be to create a new release channel for each new binary you build (or at least every new binary with an incompatible change in the native-JavaScript interface) by publishing to that new release channel with `expo publish --release-channel <channel-name>`. After creating a build with this release channel name configured, you can continue to publish future updates to this same release channel as long as they remain compatible with that build. Only builds that were configured to use that release channel will receive those updates.

### Statically Hosted Updates

Since headers sent in requests by `expo-updates` do not affect statically hosted updates (such as update packages created by `expo export`), you must host incompatible updates at different static URLs in order to control compatibility.

## Embedding Assets

In addition to loading updates from remote servers, apps with `expo-updates` installed also include the necessary capability to load updates embedded in the app binary. This is critical to ensure that your app can launch offline for all users immediately upon installation, without needing an internet connection.

When you make a release build of your app, the build process will bundle your JavaScript source code into a minified bundle and embed this in the binary, along with any other assets your app imports (with `require` or `import` or used in **app.json**). `expo-updates` includes an extra script on each platform to embed some additional metadata about the embedded assets -- namely, a minimal manifest JSON object for the update.

## Including Assets in Updates

Assets that you import in your JavaScript source can also be atomically downloaded as part of a published update. `expo-updates` will not consider an update "ready" and will not launch the update unless it has downloaded all required assets.

If you use `expo-asset` in your project (included by default if you have the `expo` package installed), you can control which imported assets will be included as part of this atomic update by using the `assetBundlePatterns` key in **app.json** to provide a list of paths in your project directory:

```
"assetBundlePatterns": [
  "**/*" // or "assets/images/*", etc.
],
```

Assets with paths matching the given patterns will be pre-downloaded by clients before the update that uses them will launch. If you have an asset that should be lazily downloaded at runtime rather than before your JavaScript is evaluated, you can use `assetBundlePatterns` to exclude it while still importing it in your JavaScript source.

Note that in order to use `expo-asset` successfully, you must use the `--assetPlugins` option to provide the Metro bundler with the `node_modules/expo-asset/tools/hashAssetFiles` plugin when you create your JavaScript bundle. If you use `expo export` or `expo publish` to create your update, this will be done automatically for you.

## Configuration Options

Some build-time configuration options are available to control various behaviors of the `expo-updates` library. You can set the URL where your app is hosted, set compatibility/version information, and choose whether your app should update automatically on launch.

On iOS, these properties are set as keys in **Expo.plist** and on Android as `meta-data` tags in **AndroidManifest.xml**, adjacent to the tags added during installation.

On Android, you may also define these properties at runtime by passing a `Map` as the second parameter of `UpdatesController.initialize()`. If provided, the values in this Map will override any values specified in **AndroidManifest.xml**. On iOS, you may set these properties at runtime by calling `[UpdatesController.sharedInstance setConfiguration:]` at any point _before_ calling `start` or `startAndShowLaunchScreen`, and the values in this dictionary will override Expo.plist.

| iOS plist/dictionary key | Android Map key | Android meta-data name         | Default | Required? |
| ------------------------ | --------------- | ------------------------------ | ------- | --------- |
| `EXUpdatesEnabled`       | `enabled`       | `expo.modules.updates.ENABLED` | `true`  | ❌        |

Whether updates are enabled. Setting this to `false` disables all update functionality, all module methods, and forces the app to load with the manifest and assets bundled into the app binary.

| iOS plist/dictionary key | Android Map key | Android meta-data name                 | Default | Required? |
| ------------------------ | --------------- | -------------------------------------- | ------- | --------- |
| `EXUpdatesURL`           | `updateUrl`     | `expo.modules.updates.EXPO_UPDATE_URL` | (none)  | ✅        |

The URL to the remote server where the app should check for updates. A request to this URL should return a valid manifest object for the latest available update that tells expo-updates how to fetch the JS bundle and other assets that comprise an update. (Example: for apps published with `expo publish`, this URL would be `https://exp.host/@username/slug`.)

| iOS plist/dictionary key | Android Map key | Android meta-data name                  | Default | Required?                                                     |
| ------------------------ | --------------- | --------------------------------------- | ------- | ------------------------------------------------------------- |
| `EXUpdatesSDKVersion`    | `sdkVersion`    | `expo.modules.updates.EXPO_SDK_VERSION` | (none)  | (exactly one of `sdkVersion` or `runtimeVersion` is required) |

The SDK version string to send under the `Expo-SDK-Version` header in the manifest request. Required for apps hosted on Expo's server.

| iOS plist/dictionary key  | Android Map key  | Android meta-data name                      | Default | Required?                                                     |
| ------------------------- | ---------------- | ------------------------------------------- | ------- | ------------------------------------------------------------- |
| `EXUpdatesRuntimeVersion` | `runtimeVersion` | `expo.modules.updates.EXPO_RUNTIME_VERSION` | (none)  | (exactly one of `sdkVersion` or `runtimeVersion` is required) |

The Runtime Version string to send under the `Expo-Runtime-Version` header in the manifest request.

| iOS plist/dictionary key  | Android Map key  | Android meta-data name                      | Default   | Required? |
| ------------------------- | ---------------- | ------------------------------------------- | --------- | --------- |
| `EXUpdatesReleaseChannel` | `releaseChannel` | `expo.modules.updates.EXPO_RELEASE_CHANNEL` | `default` | ❌        |

The release channel string to send under the `Expo-Release-Channel` header in the manifest request.

| iOS plist/dictionary key | Android Map key | Android meta-data name                              | Default  | Required? |
| ------------------------ | --------------- | --------------------------------------------------- | -------- | --------- |
| `EXUpdatesCheckOnLaunch` | `checkOnLaunch` | `expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH` | `ALWAYS` | ❌        |

The condition under which `expo-updates` should automatically check for (and download, if one exists) an update upon app launch. Possible values are `ALWAYS`, `NEVER` (if you want to exclusively control updates via this module's JS API), `WIFI_ONLY` (if you want the app to automatically download updates only if the device is on an unmetered Wi-Fi connection when it launches), or `ERROR_RECOVERY_ONLY` (if you want the app to automatically download updates only if it encounters a fatal error when launching).

Regardless of the value of this setting, as long as updates are enabled, your app can always use the JS API to manually check for and download updates in the background while your app is running.

| iOS plist/dictionary key | Android Map key | Android meta-data name                             | Default | Required? |
| ------------------------ | --------------- | -------------------------------------------------- | ------- | --------- |
| `EXUpdatesLaunchWaitMs`  | `launchWaitMs`  | `expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS` | `0`     | ❌        |

The number of milliseconds `expo-updates` should delay the app launch and stay on the splash screen while trying to download an update, before falling back to a previously downloaded version. Setting this to `0` will cause the app to always launch with a previously downloaded update and will result in the fastest app launch possible.

Some common configuration patterns are explained below:

### Automatic Updates

By default, `expo-updates` will immediately launch your app with a previously downloaded (or embedded) update when a user opens your app from being closed. It will additionally check for updates asynchronously in the background, and will try to fetch the latest published version. If a new update is available, `expo-updates` will try to download it and notify the running JavaScript of its success or failure using [events](../versions/latest/sdk/updates.md#updatesaddlistenereventlistener). A newly fetched update will be launched next time the user swipes closed and reopens the app; if you want to run it sooner, you can call [`Updates.reloadAsync`](../versions/latest/sdk/updates.md#updatesreloadasync) in your application code at an appropriate time.

You may also configure `expo-updates` to wait a specific amount of time to launch when a user opens the app by using the `launchWaitMs` setting. If a new update can be downloaded within this time, the new update will be launched right away, rather than waiting for the user to swipe closed and reopen the app. (Note, however, that if users have a slow network connection, your app can be delayed on the launch screen for as many milliseconds as `launchWaitMs`, so we recommend being conservative with this setting unless it's critically important for users to have the most recent update on each launch.) If no update is available, a previously downloaded update will be launched as soon as `expo-updates` is able to determine this.

If you want this automatic update behavior to occur only when your users are on a Wi-Fi connection, you can set the `checkOnLaunch` setting to `WIFI_ONLY`.

### Manual Updates

It's also possible to turn off these automatic updates, and to instead control updates entirely within your JS code. This is desirable if you want some custom logic around fetching updates (e.g. only when users take a specific action in your UI).

Setting `checkOnLaunch` to `NEVER` will prevent `expo-updates` from automatically fetching the latest update every time your app is launched. Only the most recent cached version of your bundle will be loaded.

You can then use the [`expo-updates`](../versions/latest/sdk/updates.md) module included with this library to download new updates and, if appropriate, notify the user and reload the experience.

```javascript
try {
  const update = await Updates.checkForUpdateAsync();
  if (update.isAvailable) {
    await Updates.fetchUpdateAsync();
    // ... notify user of update ...
    Updates.reloadAsync();
  }
} catch (e) {
  // handle or log error
}
```
