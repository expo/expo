---
title: Facebook
sourceCodeUrl: 'https://github.com/expo/expo/tree/master/packages/expo-facebook'
---

import APISection from '~/components/plugins/APISection';
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

## Example

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

## API

```js
import * as Facebook from 'expo-facebook';
```

<APISection packageName="expo-facebook" />

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
