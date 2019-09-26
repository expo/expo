---
title: StoreReview
---

Provides access to the `SKStoreReviewController` API in iOS 10.3+ devices.

> If this is used in Android the device will attempt to link to the Play Store using `ReactNative.Linking` and the `android.playStoreUrl` from the `app.json` instead. 

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-store-review`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-store-review).

## API

```js
import * as StoreReview from 'expo-store-review';
```

### `StoreReview.requestReview()`
In the ideal circumstance this will open a native modal and allow the user to select a star rating that will then be applied to the App Store without leaving the app. 
If the users device is running a version of iOS lower than 10.3, or the user is on an Android device, this will attempt to get the store URL and link the user to it.

#### Example

```js
StoreReview.requestReview()
```

### `StoreReview.isSupported()`

This will return true if the device is running iOS 10.3 or greater.

#### Example

```js
StoreReview.isSupported()
```

### `StoreReview.storeUrl()`

This uses the `Constants` API to get the `Constants.manifest.ios.appStoreUrl` on iOS, or the `Constants.manifest.android.playStoreUrl` on Android.

#### Example

```js
const url = StoreReview.storeUrl()
```

### `StoreReview.hasAction()`

This returns a boolean that let's you know if the module can preform any action. This is used for cases where the `app.json` doesn't have the proper fields, and `StoreReview.isSupported()` returns false.

#### Example

```js
if (StoreReview.hasAction()) {

}
```

---

## Usage

It is important that you follow the [Human Interface Guidelines](https://developer.apple.com/ios/human-interface-guidelines/system-capabilities/ratings-and-reviews/) when using this API.

**Specifically:**

* Don't call `StoreReview.requestReview()` from a button - instead try calling it after the user has finished some signature interaction in the app.
* Don't spam the user
* Don't request a review when the user is doing something time sensitive like navigating.

