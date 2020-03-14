---
title: Facebook
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-36/packages/expo-facebook'
---

import PlatformsSection from '~/components/plugins/PlatformsSection';

**`expo-facebook`** provides Facebook integration, such as logging in through Facebook, for React Native apps. Expo exposes a minimal native API since you can access Facebook's [Graph API](https://developers.facebook.com/docs/graph-api) directly through HTTP (using [fetch](https://facebook.github.io/react-native/docs/network.html#fetch), for example).

<PlatformsSection android emulator ios simulator web={{ pending: 'https://github.com/expo/expo/pull/6862' }} />

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-facebook`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-facebook).

For ejected (see: [ExpoKit](../../expokit/overview)) apps, here are links to the [iOS Installation Walkthrough](https://developers.facebook.com/docs/ios/getting-started/) and the [Android Installation Walkthrough](https://developers.facebook.com/docs/android/getting-started).

## Configuration

### Registering your app with Facebook

Follow [Facebook's developer documentation](https://developers.facebook.com/docs/apps/register) to register an application with Facebook's API and get an application ID. Take note of this application ID because it will be used as the `appId` option in your [`Facebook.logInWithReadPermissionsAsync`](#expofacebookloginwithreadpermissionsasync 'Facebook.logInWithReadPermissionsAsync') call. Then follow these steps based on the platforms you're targetting. This will need to be done from the [Facebook developer site](https://developers.facebook.com/):

- **The Expo client app**

  - Add `host.exp.Exponent` as an iOS _Bundle ID_. Add `rRW++LUjmZZ+58EbN5DVhGAnkX4=` as an Android _key hash_. Your app's settings should end up including the following under "Settings > Basic":

![](/static/images/facebook-app-settings.png)

- **iOS standalone app**

  - Add your app's Bundle ID as a _Bundle ID_ in the app settings page pictured above. If you still have the `host.exp.Exponent` ID listed there, remove it.
  - In your [app.json](../../workflow/configuration/), add a field `facebookScheme` with your Facebook login redirect URL scheme found [here](https://developers.facebook.com/docs/facebook-login/ios) under _4. Configure Your info.plist_. It should look like `"fb123456"`.
  - Also in your [app.json](../../workflow/configuration/), add your [Facebook App ID and Facebook Display Name](https://developers.facebook.com/docs/facebook-login/ios) under the `facebookAppId` and `facebookDisplayName` keys.

- **Android standalone app**

  - [Build your standalone app](../../distribution/building-standalone-apps/#building-standalone-apps) for Android.
  - Run `expo fetch:android:hashes`.
  - Copy `Facebook Key Hash` and paste it as an additional key hash in your Facebook developer page pictured above.

You may have to switch the app from 'development mode' to 'public mode' on the Facebook developer page before other users can log in.

## API

```js
import * as Facebook from 'expo-facebook';
```

### `Facebook.initializeAsync(options: FacebookInitializationOptions): Promise<void>`

Calling this method ensures that the SDK is initialized. You have to call this method before calling any method that uses the FBSDK (ex: `logInWithReadPermissionsAsync`, `logOutAsync`) to ensure that Facebook support is initialized properly.

- On native platforms you can optional provide an `appId` argument.
  - If you don't provide it, Facebook SDK will try to use `appId` from native app resources (which in standalone apps you would define in `app.json`, in Expo client are unavailable and in bare you configure yourself according to Facebook setup documentation for [iOS][d-fbsdk-ios-config] and [Android][d-fbsdk-android-manifest]]). If it fails to find one, the promise will be rejected.
  - The same resolution mechanism works for `appName`.
- If you provide an explicit `appId`, it will override any other source.

#### Login Options

A map of options:

- `FacebookInitializationOptions` type:

  - **appId (_string | undefined_)** Application ID used to initialize the FBSDK app. On Android and iOS if you don't provide this, Facebook SDK will try to use `appId` from native app resources (which in standalone apps you would define in `app.json`, in the Expo client are unavailable, and in bare apps you configure yourself according to Facebook setup documentation for [iOS][d-fbsdk-ios-config] and [Android][d-fbsdk-android-manifest]]). If it fails to find one, the promise will be rejected.
  - **version (_string | undefined_)** Selects the [version of FBSDK](https://developers.facebook.com/docs/javascript/reference/FB.init/v5.0) to use.
  - **appName (_string | undefined_)** An optional Facebook App Name argument for iOS and Android.
  - **autoLogAppEvents (_boolean | undefined_)** Sets whether the Facebook SDK should log app events. App events involve e.g. app installs, app launches (more info [here](https://developers.facebook.com/docs/app-events/getting-started-app-events-android/#auto-events) and [here](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios#auto-events)). In some cases, you may want to disable or delay the collection of automatically logged events, such as to obtain user consent or fulfill legal obligations. This method corresponds to [this](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios#disable-auto-events) and [this](https://developers.facebook.com/docs/app-events/getting-started-app-events-android/#disable-auto-events) native SDK methods.
  - **domain (_string | undefined_)** Android: Sets the base Facebook domain to use when making Web requests. Defaults to: `'connect.facebook.net'`.

[d-fbsdk-ios-config]: https://developers.facebook.com/docs/facebook-login/ios#4--configure-your-project
[d-fbsdk-android-manifest]: https://developers.facebook.com/docs/facebook-login/android#manifest

### `Facebook.logInWithReadPermissionsAsync(options)`

Prompts the user to log into Facebook and grants your app permission
to access their Facebook data. On iOS and Android, if the Facebook app isn't installed then a web view will be used to authenticate.

#### Initialization Options

A map of options:

- **permissions (_array_)** -- An array specifying the permissions to ask for from Facebook for this login. The permissions are strings as specified in the [Facebook API documentation](https://developers.facebook.com/docs/facebook-login/permissions). The default permissions are `['public_profile', 'email']`.

#### Returns

If the user or Facebook cancelled the login, returns `{ type: 'cancel' }`.

Otherwise, returns `{ type: 'success' } & FacebookAuth`.

- `FacebookAuth` type:

  - **token (_string_)** Access token for the authenticated session. This'll provide access to use with Facebook Graph API.
  - **userId (_string_)** The ID of the user.
  - **appId (_string_)** Application ID used to initialize the FBSDK app.
  - **permissions (_string[] | undefined_)** List of granted permissions.
  - **declinedPermissions (_string[] | undefined_)** List of requested permissions that the user has declined.
  - **expiredPermissions (_string[] | undefined_)** List of permissions that were expired with this access token.
  - **expirationDate (_Date_)** Gets the time at which the `token` expires.
  - **dataAccessExpirationDate (_Date_)** Time at which the current user data access expires.
  - **refreshDate (_Date | undefined_)** The last time the `token` was refreshed (or when it was first obtained).
  - **tokenSource (_string | undefined_)** Android: Indicates how this `token` was obtained.
  - **signedRequest (_string | undefined_)** A valid raw signed request as a string.
  - **graphDomain (_string | undefined_)** A website domain within the Graph API.

### `Facebook.setAutoInitEnabledAsync(enabled: boolean): Promise<void>`

Sets whether Facebook SDK should autoinitialize itself. SDK initialization involves eg. fetching app settings from Facebook or a profile of the logged in user. In some cases, you may want to disable or delay the SDK initialization, such as to obtain user consent or fulfill legal obligations. This method corresponds to [this](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios#disable-sdk-initialization) and [this](https://developers.facebook.com/docs/app-events/getting-started-app-events-android/#disable-sdk-initialization) native SDK methods. Even though calling this method with `enabled == true` initializes the Facebook SDK on iOS, it does not on Android and we recommend always calling `initializeAsync` before performing any actions with effects that should be visible to the user (like `loginWithPermissions`).

In Expo, by default, autoinitialization of the Facebook SDK is disabled. You may change this value in runtime by calling this method or customize this feature in buildtime by setting appropriate `app.json` fields. The setting value is persisted across runs (value set with this method overriddes value from buildtime).

### `Facebook.setAutoLogAppEventsEnabledAsync(enabled: boolean): Promise<void>`

Sets whether Facebook SDK should log app events. App events involve app eg. installs, app launches (more info [here](https://developers.facebook.com/docs/app-events/getting-started-app-events-android/#auto-events) and [here](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios#auto-events)). In some cases, you may want to disable or delay the collection of automatically logged events, such as to obtain user consent or fulfill legal obligations. This method corresponds to [this](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios#disable-auto-events) and [this](https://developers.facebook.com/docs/app-events/getting-started-app-events-android/#disable-auto-events) native SDK methods.

In Expo, by default, automatic logging app events is disabled. You may change this value in runtime by calling this method or customize this feature in buildtime by setting appropriate `app.json` fields. The setting value is persisted across runs (value set with this method overriddes value from buildtime).

### `Facebook.setAdvertiserIDCollectionEnabledAsync(enabled: boolean): Promise<void>`

Sets whether Facebook SDK should collect and attach `advertiser-id` to sent events. `advertiser-id` let you identify and target specific customers. To learn more visit [Facebook documentation](https://developers.facebook.com/docs/app-ads/targeting/mobile-advertiser-ids) describing that topic. In some cases, you may want to disable or delay the collection of `advertiser-id`, such as to obtain user consent or fulfill legal obligations. This method corresponds to [this](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios#disable-advertiser-id) and [this](https://developers.facebook.com/docs/app-events/getting-started-app-events-android/#disable-advertiser-id) native SDK methods.

In Expo, by default, collecting those IDs is disabled. You may change this value in runtime by calling this method or customize this feature in buildtime by setting appropriate `app.json` fields. The setting value is persisted across runs (value set with this method overriddes value from buildtime).

#### Example

```javascript
async function logIn() {
  try {
    await Facebook.initializeAsync({
      appId: '<APP_ID>',
    });
    const {
      type,
      token,
      expirationDate,
      permissions,
      declinedPermissions,
    } = await Facebook.logInWithReadPermissionsAsync({
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

Given a valid Facebook application ID in place of `<APP_ID>`, the code above will prompt the user to log into Facebook then display the user's name. This uses React Native's [fetch](https://facebook.github.io/react-native/docs/network.html#fetch) to query Facebook's [Graph API](https://developers.facebook.com/docs/graph-api).

### `Facebook.logOutAsync()`

Logs out of the currently authenticated session.

### `Facebook.getAccessTokenAsync()`

Returns the `FacebookAuth` object if a user is authenticated, and `null` if no valid authentication exists.

You can use this method to check if the user should sign in or not.

#### Returns

- `FacebookAuth` type:

  - **token (_string_)** Access token for the authenticated session. This will provide access to use with Facebook Graph API.
  - **userId (_string_)** The ID of the user.
  - **appId (_string_)** Application ID used to initialize the FBSDK app.
  - **permissions (_string[] | undefined_)** List of granted permissions.
  - **declinedPermissions (_string[] | undefined_)** List of requested permissions that the user has declined.
  - **expiredPermissions (_string[] | undefined_)** List of permissions that were expired with this access token.
  - **expirationDate (_Date_)** Gets the time at which the `token` expires.
  - **dataAccessExpirationDate (_Date_)** Time at which the current user data access expires.
  - **refreshDate (_Date | undefined_)** Last time the `token` was refreshed (or when it was first obtained).
  - **tokenSource (_string | undefined_)** Android: Indicates how this `token` was obtained.
  - **signedRequest (_string | undefined_)** A valid raw signed request as a string.
  - **graphDomain (_string | undefined_)** A website domain within the Graph API.

```tsx
async function toggleAuthAsync() {
  const auth = await Facebook.getAccessTokenAsync();

  if (!auth) {
    // Log in
  } else {
    // Log out
  }
}
```

## Error Codes

### `ERR_FACEBOOK_UNINITIALIZED`

Ensure `initializeAsync` has successfully resolved before attempting to use the FBSDK.

### `ERR_FACEBOOK_MISCONFIGURED`

Failed to initialize the FBSDK app because the `appId` option wasn't provided and the `appId` couldn't be resolved automatically from the native config files.

### `ERR_FACEBOOK_LOGIN`

An error occurred while trying to log in to Facebook.

## Guide

You can use the `fetch` API to get info about the user from the [Facebook Graph API](https://developers.facebook.com/docs/graph-api/using-graph-api/). Here are some helper methods you can use to make data access easier.

```ts
// Get default info about the currently authenticated user.
async function getUserAsync() {
  const { name } = await requestAsync({ path: 'me' });
  console.log(`Hello ${name} 👋`);
}

// Request data from the Facebook Graph API.
// Learn more https://developers.facebook.com/docs/graph-api/using-graph-api/
async function requestAsync(path: string, token?: string): Promise<any> {
  let resolvedToken = token;
  if (!token) {
    const auth = await Facebook.getAccessTokenAsync();
    if (!auth) {
      throw new Error(
        'User is not authenticated. Ensure `logInWithReadPermissionsAsync` has successfully resolved before attempting to use the FBSDK Graph API.'
      );
    }
    resolvedToken = auth.token;
  }
  const response = await fetch(`https://graph.facebook.com/${path}?access_token=${resolvedToken}`);
  const body = await response.json();
  return body;
}
```
