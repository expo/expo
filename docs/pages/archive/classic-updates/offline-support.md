---
title: Offline Support
---

Your app will encounter circumstances where the internet connection is sub-par or totally unavailable and it still needs to work reasonably well. This guide offers more information and best practices for providing a great experience while the device is offline.

## Load JS updates in the background

When you [publish](/archive/classic-updates/publishing.md) an update to your app, your users will receive the new version of your code in an update. The new version will download either next time the app starts, or next time you call [Updates.reload()](../versions/latest/sdk/updates.md). This behavior also applies the very first time the user opens your app.

Expo offers multiple behaviors for how it should download your JS. It can either block the UI with a [splash screen](splash-screens.md) or [AppLoading component](../versions/latest/sdk/app-loading.md) until the new JS is downloaded, or it can immediately show an old version of your JS and download the update in the background. The former option is better if your users must have the latest version at all times; the latter option is better if you have a bad internet connection and need to show something right away.

To force JS updates to run in the background (rather than synchronously checking and downloading on app start), set `updates.fallbackToCacheTimeout` to `0` in **app.json**. You can also listen to see when a new version has finished downloading. For more information, see [configuring updates](configuring-updates.md).

## Cache your assets after downloading

By default, all of your assets (images, fonts, etc.) are [uploaded to Expo's CDN](assets.md) when you publish updates to your app. Once they're downloaded, you can [cache them](/archive/classic-updates/preloading-and-caching-assets.md) so you don't need to download them a second time. If you publish changes, the cache will be invalidated and the changed version will be downloaded.

## Bundle your assets inside your standalone binary

Expo can bundle assets into your standalone binary during the build process so that they will be available immediately, even if the user has never run your app before. This is important if:

- Your users may not have internet the first time they open your app, or
- If your app relies on a nontrivial amount of assets for the very first screen to function properly.

### EAS Build

When using `eas build`, `expo publish` is **not** run as part of the build process, so the `assetBundlePatterns` key doesn't apply in this case. Instead, any assets that are explicitly `require()`'d anywhere in your codebase (including in your dependencies) are bundled into your binary. This is the same behavior as with regular React Native apps built directly with Xcode or Android Studio.

### Classic builds

To bundle assets in your binary, use the [assetBundlePatterns](../workflow/configuration.md) key in **app.json** to provide a list of paths in your project directory:

```
"assetBundlePatterns": [
  "assets/images/*"
],
```

Images with paths matching the given patterns will be bundled into your native binaries next time you run `expo build`.

## Listen for changes in network availability

The React Native community created the [`@react-native-community/netinfo`](https://github.com/react-native-netinfo/react-native-netinfo) package, which informs you if your device's reachability changes. You may want to change your UI (e.g. show a banner, or disable some functions) if you notice that there's no connection available.
