---
title: Configuring Updates
---

> This doc was archived in August 2022 and will not receive any further updates. Please use EAS Update instead. [Learn more](/eas-update/introduction)

Expo provides various settings to configure how your app receives updates. Updates allow you to publish a new version of your app JavaScript and assets without building a new version of your app and re-submitting to app stores. ([Read more about the limitations](/archive/publishing.md)).

To create an update of your app, run `expo publish`. If you're using release channels, specify one with `--release-channel <channel-name>` option. **Please note**- if you wish to update the SDK version of your app, or make [any of these changes](/archive/publishing.md#some-native-configuration-cant-be-updated-by), you'll need to rebuild your app with `eas build` (or `expo build` if you are using the Classic Builds service) and upload the binary file to the appropriate app store ([see the docs here](/build/setup.md)).

Updates are controlled by the `updates` settings in app.json, which handle the initial app load, and the Updates SDK module, which allows you to fetch updates asynchronously from your JS.

## Automatic Updates

If your **app.json** does not contain an `updates.fallbackToCacheTimeout` field it will default to `0` and `expo-updates` will attempt to start your app immediately with a cached bundle while downloading a newer one in the background for future use. When using this configuration, users that download the app from a store and launch it for the first time will always see the version of the app that the binary was built against. `Updates.addListener` provides a hook to let you respond when the new bundle is finished downloading. You can use this to notify users that they should restart the app, and you can also restart it programmatically with `Updates.reloadAsync()`, eg: in response to a prompt to the user.

You can also set a nonzero timeout, in which case Expo will attempt to download a new update before launching the app. If there is no network connection available, or it has not finished downloading in the allotted time, Expo will fall back to loading a cached version of your app, and continue trying to fetch the update in the background (at which point it will be saved into the cache for the next app load). We strongly advise against blocking app loading on fetching an update because it can leave users with the perception that the app is not working if it takes a while to download the update, and every launch will be slower because a network request has to be made to check for an update before proceeding to the app.

In Expo Go, the latest published bundle of your app will always be launched (unless the request times out or network connection is unavailable), regardless of the `updates` settings in your app config.

## Manual Updates

In standalone apps, it is also possible to turn off automatic updates, and to instead control updates entirely within your JS code. This is desirable if you want some custom logic around fetching updates (e.g. only over Wi-Fi).

Setting `updates.checkAutomatically` to `"ON_ERROR_RECOVERY"` in app.json will prevent Expo from automatically fetching the latest update every time your app is launched. Only the most recent cached version of your bundle will be loaded. It will only automatically fetch an update if the last run of the cached bundle produced a fatal JS error.

You can then use the `expo-updates` module to download new updates and, if appropriate, notify the user to reload their app.

```javascript
import * as Updates from 'expo-updates';

try {
  const update = await Updates.checkForUpdateAsync();
  if (update.isAvailable) {
    await Updates.fetchUpdateAsync();
    // ... notify user of update ...
    await Updates.reloadAsync();
  }
} catch (e) {
  // handle or log error
}
```

Checking for an update uses a device's bandwidth and battery life like any network call. Additionally, updates served by Expo may be rate limited. A good rule of thumb to check for updates judiciously is to use check when the user launches or foregrounds the app. Avoid polling for updates in a frequent loop.

Note that `checkAutomatically: "ON_ERROR_RECOVERY"` will be ignored in Expo Go, although the imperative Updates methods will still function normally.

## Disabling Updates

It is possible to entirely disable updates in an app, by setting `updates.enabled` to `false` in **app.json**. This will ignore all code paths that fetch app bundles from Expo's servers. In this case, all updates to your app will need to be routed through the iOS App Store and/or Google Play Store.

This setting is ignored in the Expo Go app.
