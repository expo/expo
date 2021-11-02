---
title: Facebook
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-41/packages/expo-facebook'
---

import PlatformsSection from '~/components/plugins/PlatformsSection';
import InstallSection from '~/components/plugins/InstallSection';

**`expo-facebook`** provides Facebook integration, such as logging in through Facebook, for React Native apps. Expo exposes a minimal native API since you can access Facebook's [Graph API](https://developers.facebook.com/docs/graph-api) directly through HTTP (using [fetch](https://reactnative.dev/docs/network.html#fetch), for example).

<PlatformsSection android emulator ios simulator />

## Installation

<InstallSection packageName="expo-facebook" />

For bare apps, here are links to the [iOS Installation Walkthrough](https://developers.facebook.com/docs/ios/getting-started/#step-3---configure-your-project) and the [Android Installation Walkthrough](https://developers.facebook.com/docs/android/getting-started#app_id).

## Configuration

### Registering your app with Facebook

> 💡 When following these steps you will find on the Facebook Developer site that there are many fields and steps that you don't actually care about. Just look for the information that we ask you for and you will be OK!

Follow [Facebook's developer documentation](https://developers.facebook.com/docs/apps/register) to register an application with Facebook's API and get an application ID. Take note of this application ID because it will be used as the `appId` option in your [`Facebook.logInWithReadPermissionsAsync`](#expofacebookloginwithreadpermissionsasync 'Facebook.logInWithReadPermissionsAsync') call.

Then follow these steps based on the platforms you're targeting. This will need to be done from the [Facebook developer site](https://developers.facebook.com/).

Expo Go from the Android Play Store will use the Facebook App ID that you provide, however, all Facebook API calls in the **Expo Go from the iOS App Store will use Expo's own Facebook App ID**. This is due to underlying configuration limitations, but the good news is it means less setup for you! The slight downside to this is that you can't customize which permissions your app requests from Facebook (like `user_photos` or `user_friends`), or integrate Facebook login with other services like Firebase auth. If you need that functionality on iOS, you can build a standalone app. An easy way to test this is to run `expo build:ios -t simulator` and install the app in your simulator.

#### Configure **app.json**

- Add the field `facebookScheme` with your Facebook login redirect URL scheme found [here](https://developers.facebook.com/docs/facebook-login/ios) under "_4. Configure Your info.plist_." It should look like `"fb123456"`. If you do not do this, Facebook will not be able to redirect to your app after logging in.

- Add the fields `facebookAppId` and `facebookDisplayName`, using your [Facebook App ID and Facebook Display Name](https://developers.facebook.com/docs/facebook-login/ios), respectively.

- Optional fields
  - `facebookAutoLogAppEventsEnabled`, defaults to Facebook's default policy (Only applies to standalone apps)
  - `facebookAdvertiserIDCollectionEnabled`, defaults to Facebook's default policy (Only applies to standalone apps)

#### iOS standalone app

- Add your app's Bundle ID as a _Bundle ID_ in the app settings page pictured below.

> An easy way to test that this is set up correctly is to run a simulator build with `expo build:ios -t simulator`.

#### Android standalone app

- [Build your standalone app](../../../distribution/building-standalone-apps.md#building-standalone-apps) for Android.
- Run `expo fetch:android:hashes`.
- Copy `Facebook Key Hash` and paste it as a key hash in your Facebook developer page pictured below.

![](/static/images/facebook-app-settings.png)

You may have to switch the app from 'development mode' to 'public mode' on the Facebook developer page before other users can log in. This requires adding a privacy policy URL, which can be as simple as a GitHub Gist.

## API

```js
import * as Facebook from 'expo-facebook';
```

### `Facebook.initializeAsync(options: FacebookInitializationOptions): Promise<void>`

Calling this method ensures that the SDK is initialized. You have to call this method before calling any method that uses the Facebook SDK (ex: `logInWithReadPermissionsAsync`, `logOutAsync`) to ensure that Facebook support is initialized properly.

- On Android and iOS you can optionally provide an `appId` argument.
  - If you don't provide it, the Facebook SDK will try to use `appId` from native app resources (which in standalone apps you define in **app.json**, in the app store development clients is unavailable, and in bare apps you configure yourself according to the Facebook setup documentation for [iOS][d-fbsdk-ios-config] and [Android][d-fbsdk-android-manifest]]). If the Facebook SDK fails to find a value for `appId`, the returned promise will be rejected.
  - The same resolution mechanism works for `appName`.
- If you provide an explicit `appId`, it will override any other source.

#### Login Options

A map of options:

- `FacebookInitializationOptions` type:

  - **appId (_string | undefined_)** Application ID used to specify the Facebook app. On Android and iOS if you don't provide this, the Facebook SDK will try to use `appId` from native app resources (which in standalone apps you define in **app.json**, in the app store development clients is unavailable, and in bare apps you configure yourself according to the Facebook setup documentation for [iOS][d-fbsdk-ios-config] and [Android][d-fbsdk-android-manifest]). If the Facebook SDK fails to find a value for `appId`, the returned promise will be rejected.
  - **version (_string | undefined_)** Selects the [version of the Facebook SDK](https://developers.facebook.com/docs/javascript/reference/FB.init/v5.0) to use.
  - **appName (_string | undefined_)** An optional Facebook App Name argument for Android and iOS.
  - **autoLogAppEvents (_boolean | undefined_)** Sets whether the Facebook SDK should log app events. App events involve e.g. app installs, app launches (more info [here](https://developers.facebook.com/docs/app-events/getting-started-app-events-android/#auto-events) and [here](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios#auto-events)). In some cases, you may want to disable or delay the collection of automatically logged events, such as to obtain user consent or fulfill legal obligations. This method corresponds to [this iOS](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios#disable-auto-events) and [this Android](https://developers.facebook.com/docs/app-events/getting-started-app-events-android/#disable-auto-events) native SDK method. The default value is `false`.
  - **domain (_string | undefined_)** _(Android only)_ Sets the base Facebook domain to use when making Web requests. Defaults to: `'connect.facebook.net'`.

[d-fbsdk-ios-config]: https://developers.facebook.com/docs/facebook-login/ios#4--configure-your-project
[d-fbsdk-android-manifest]: https://developers.facebook.com/docs/facebook-login/android#manifest

### `Facebook.requestPermissionsAsync()`

Asks for permissions to use data for tracking the user or the device.

> iOS: it requires the `NSUserTrackingUsageDescription` message added to the **Info.plist**.

#### Returns

A promise that resolves to an object of type [PermissionResponse](permissions.md#permissionresponse).

### `Facebook.getPermissionsAsync()`

Checks application's permissions for using data for tracking the user or the device.

> iOS: it requires the `NSUserTrackingUsageDescription` message added to the **Info.plist**.

#### Returns

A promise that resolves to an object of type [PermissionResponse](permissions.md#permissionresponse).

### `Facebook.logInWithReadPermissionsAsync(options)`

Prompts the user to log into Facebook and grants your app permission
to access their Facebook data. On iOS and Android, if the Facebook app isn't installed then a web view will be used to authenticate.

#### Initialization Options

A map of options:

- **permissions (_array_)** -- An array specifying the permissions to ask for from Facebook for this login. The permissions are strings as specified in the [Facebook API documentation](https://developers.facebook.com/docs/facebook-login/permissions). The default permissions are `['public_profile', 'email']`.

#### Returns

If the user or Facebook cancelled the login, returns `{ type: 'cancel' }`.

Otherwise, returns `{ type: 'success' } &` [`FacebookAuthenticationCredential`](#facebookauthenticationcredential).

### `Facebook.setAdvertiserTrackingEnabledAsync(enabled: boolean): Promise<boolean>`

Sets whether Facebook SDK can use the device's Identifier for Advertisers (IDFA) to serve personalized ads to the user.
Starting with iOS 14.5, an app will need to receive the user's permission to access their device's advertising identifier. Tracking refers to the act of linking user or device data collected from your app with user or device data collected from other companies' apps, websites, or offline properties for targeted advertising or advertising measurement purposes.

Use this method to indicate whether Facebook SDK can use event data for ads in line with your own legal obligations, platform terms and commitments you've made to your users.

#### Returns

A promise that resolves to a boolean whether the value is set successfully. It will always return `false` on Android, iOS 13 and below.

### `Facebook.setAutoLogAppEventsEnabledAsync(enabled: boolean): Promise<void>`

Sets whether the Facebook SDK should log app events. App events involve e.g. app installs, app launches (more info [here (Android)](https://developers.facebook.com/docs/app-events/getting-started-app-events-android/#auto-events) and [here (iOS)](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios#auto-events)). In some cases, you may want to disable or delay the collection of automatically logged events, such as to obtain user consent or fulfill legal obligations. This method corresponds to [this iOS](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios#disable-auto-events) and [this Android](https://developers.facebook.com/docs/app-events/getting-started-app-events-android/#disable-auto-events) native SDK method.

In Expo, by default, automatically logging Facebook app events is disabled. You may change this value at runtime by calling this method or customize this feature at build time by setting the appropriate **app.json** fields. The value set with this method persists across launches of the app and overrides the build-time configuration value.

### `Facebook.setAdvertiserIDCollectionEnabledAsync(enabled: boolean): Promise<void>`

Sets whether the Facebook SDK should collect and attach the `advertiser-id` field to sent events. The `advertiser-id` field lets you identify and target specific customers. To learn more visit [Facebook's documentation](https://developers.facebook.com/docs/app-ads/targeting/mobile-advertiser-ids) on this topic. In some cases, you may want to disable or delay the collection of the `advertiser-id` field, such as to obtain user consent or fulfill legal obligations. This method corresponds to [this iOS](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios#disable-advertiser-id) and [this Android](https://developers.facebook.com/docs/app-events/getting-started-app-events-android/#disable-advertiser-id) native SDK method.

In Expo, by default, collecting the advertiser ID is disabled. You may change this value at runtime by calling this method or customize this feature at build time by setting the appropriate **app.json** fields. The value set with this method persists across launches of the app and overrides the build-time configuration value.

#### Example

```javascript
async function logIn() {
  try {
    await Facebook.initializeAsync({
      appId: '<APP_ID>',
    });
    const { type, token, expirationDate, permissions, declinedPermissions } =
      await Facebook.logInWithReadPermissionsAsync({
        permissions: ['public_profile'],
      });
    if (type === 'success') {
      // Get the user's name using Facebook's Graph API
      const response = await fetch(`https://graph.facebook.com/me?access_token=${token}`);
      Alert.alert('Logged in!', `Hi ${(await response.json()).name}!`);
    } else {
      // type === 'cancel'
    }
  } catch ({ message }) {
    alert(`Facebook Login Error: ${message}`);
  }
}
```

Given a valid Facebook application ID in place of `<APP_ID>`, the code above will prompt the user to log into Facebook then display the user's name. This uses React Native's [fetch](https://reactnative.dev/docs/network.html#fetch) to query Facebook's [Graph API](https://developers.facebook.com/docs/graph-api).

### `Facebook.logOutAsync()`

Logs out of the currently authenticated session.

### `Facebook.getAuthenticationCredentialAsync()`

Returns the `FacebookAuthenticationCredential` object if a user is authenticated, and `null` if no valid authentication exists.

You can use this method to check if the user should sign in or not.

#### Returns

- A promise that resolves a [`FacebookAuthenticationCredential`][#facebookauthenticationcredential].

```tsx
async function toggleAuthAsync() {
  const auth = await Facebook.getAuthenticationCredentialAsync();

  if (!auth) {
    // Log in
  } else {
    // Log out
  }
}
```

## Types

### FacebookAuthenticationCredential

- **token (_string_)** Access token for the authenticated session. This token provides access to the Facebook Graph API.
- **userId (_string_)** App-scoped Facebook ID of the user.
- **appId (_string_)** Application ID used to initialize the Facebook SDK app.
- **permissions (_string[] | undefined_)** List of granted permissions.
- **declinedPermissions (_string[] | undefined_)** List of requested permissions that the user has declined.
- **expiredPermissions (_string[] | undefined_)** List of permissions that were expired with this access token.
- **expirationDate (_Date_)** Time at which the `token` expires.
- **dataAccessExpirationDate (_Date_)** Time at which the current user data access expires.
- **refreshDate (_Date | undefined_)** The last time the `token` was refreshed (or when it was first obtained).
- **tokenSource (_string | undefined_)** _(Android only)_ Indicates how this `token` was obtained.
- **signedRequest (_string | undefined_)** A valid raw signed request as a string.
- **graphDomain (_string | undefined_)** A website domain within the Graph API.

## Error Codes

### `ERR_FACEBOOK_UNINITIALIZED`

Attempted to use the Facebook SDK before it was initialized. Ensure `initializeAsync` has successfully resolved before attempting to use the Facebook SDK.

### `ERR_FACEBOOK_MISCONFIGURED`

Failed to initialize the Facebook SDK app because the `appId` option wasn't provided and the `appId` couldn't be resolved automatically from the native configuration files.

### `ERR_FACEBOOK_LOGIN`

An error occurred while trying to log in to Facebook.

## Guide

You can use the `fetch` API to get info about the user from the [Facebook Graph API](https://developers.facebook.com/docs/graph-api/using-graph-api/). Here are some helper methods you can use to make data access easier.

```ts
// Get default info about the currently authenticated user.
async function getUserAsync() {
  const { name } = await requestAsync('me');
  console.log(`Hello ${name} 👋`);
}

// Request data from the Facebook Graph API.
// Learn more https://developers.facebook.com/docs/graph-api/using-graph-api/
async function requestAsync(path: string, token?: string): Promise<any> {
  let resolvedToken = token;
  if (!token) {
    const auth = await Facebook.getAuthenticationCredentialAsync();
    if (!auth) {
      throw new Error(
        'User is not authenticated. Ensure `logInWithReadPermissionsAsync` has successfully resolved before attempting to use the FBSDK Graph API.'
      );
    }
    resolvedToken = auth.token;
  }
  const response = await fetch(
    `https://graph.facebook.com/${path}?access_token=${encodeURIComponent(resolvedToken)}`
  );
  const body = await response.json();
  return body;
}
```
