---
title: StoreReview
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-36/packages/expo-store-review'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`expo-store-review`** provides access to the `SKStoreReviewController` API in iOS 10.3+ devices, allowing you to ask the user to rate your app without ever having to leave the app itself.

> If this is used in Android the device will attempt to link to the Play Store using `ReactNative.Linking` and the `android.playStoreUrl` from the `app.json` instead.

<PlatformsSection android emulator ios simulator />

## Installation

<InstallSection packageName="expo-store-review" />

## API

```js
import * as StoreReview from 'expo-store-review';
```

### `StoreReview.requestReview()`

In the ideal circumstance this will open a native modal and allow the user to select a star rating that will then be applied to the App Store without leaving the app.
If the users device is running a version of iOS lower than 10.3, or the user is on an Android device, this will attempt to get the store URL and link the user to it.

#### Example

```js
StoreReview.requestReview();
```

### `StoreReview.isAvailableAsync()`

Determines if the platform has the capabilities to use `StoreReview.requestReview()`. On iOS, this will return `true` if the device is running iOS 10.3+. On Android, this will return `true`. On Web, this will return `false`.

#### Example

```js
StoreReview.isAvailableAsync();
```

### `StoreReview.storeUrl()`

This uses the `Constants` API to get the `Constants.manifest.ios.appStoreUrl` on iOS, or the `Constants.manifest.android.playStoreUrl` on Android.

In the bare workflow, this will return `null`.

#### Example

```js
const url = StoreReview.storeUrl();
```

### `StoreReview.hasAction()`

This returns a promise that resolves to a boolean that let's you know if the module can perform any action. This is used for cases where the `app.json` doesn't have the proper fields, and `StoreReview.isAvailableAsync()` returns false.

#### Example

```js
if (await StoreReview.hasAction()) {
}
```

---

## Usage

It is important that you follow the [Human Interface Guidelines](https://developer.apple.com/ios/human-interface-guidelines/system-capabilities/ratings-and-reviews/) when using this API.

**Specifically:**

- Don't call `StoreReview.requestReview()` from a button - instead try calling it after the user has finished some signature interaction in the app.
- Don't spam the user
- Don't request a review when the user is doing something time sensitive like navigating.
