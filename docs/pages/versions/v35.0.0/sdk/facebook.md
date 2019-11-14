---
title: Facebook
---

Provides Facebook integration for Expo apps. Expo exposes a minimal native API since you can access Facebook's [Graph API](https://developers.facebook.com/docs/graph-api) directly through HTTP (using [fetch](https://facebook.github.io/react-native/docs/network.html#fetch), for example).

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-facebook`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-facebook).

For ejected (see: [ExpoKit](../../expokit/overview)) apps, here are links to the [iOS Installation Walkthrough](https://developers.facebook.com/docs/ios/getting-started/) and the [Android Installation Walkthrough](https://developers.facebook.com/docs/android/getting-started).

> **Note**: Not compatible with web.

## Configuration

### Registering your app with Facebook

Follow [Facebook's developer documentation](https://developers.facebook.com/docs/apps/register) to register an application with Facebook's API and get an application ID. Take note of this application ID because it will be used as the `appId` option in your [`Facebook.logInWithReadPermissionsAsync`](#expofacebookloginwithreadpermissionsasync 'Facebook.logInWithReadPermissionsAsync') call. Then follow these steps based on the platforms you're targetting. This will need to be done from the [Facebook developer site](https://developers.facebook.com/):

- **The Expo client app**

  - Add `host.exp.Exponent` as an iOS _Bundle ID_. Add `rRW++LUjmZZ+58EbN5DVhGAnkX4=` as an Android _key hash_. Your app's settings should end up including the following under "Settings > Basic":

![](/static/images/facebook-app-settings.png)

- **iOS standalone app**

  - Add your app's Bundle ID as a _Bundle ID_ in app's settings page pictured above.
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

### `Facebook.logInWithReadPermissionsAsync(appId, options)`

Prompts the user to log into Facebook and grants your app permission
to access their Facebook data.

#### param string appId

Your Facebook application ID. [Facebook's developer documentation](https://developers.facebook.com/docs/apps/register) describes how to get one.

#### param object options

A map of options:

- **permissions (_array_)** -- An array specifying the permissions to ask for from Facebook for this login. The permissions are strings as specified in the [Facebook API documentation](https://developers.facebook.com/docs/facebook-login/permissions). The default permissions are `['public_profile', 'email']`.

#### Returns

If the user or Facebook cancelled the login, returns `{ type: 'cancel' }`.

Otherwise, returns `{ type: 'success', token, expires, permissions, declinedPermissions }`. `token` is a string giving the access token to use with Facebook HTTP API requests. `expires` is the time at which this token will expire, as seconds since epoch. You can save the access token using, say, `AsyncStorage`, and use it till the expiration time. `permissions` is a list of all the approved permissions, whereas `declinedPermissions` is a list of the permissions that the user has rejected.

#### Example

```javascript
async function logIn() {
  try {
    const {
      type,
      token,
      expires,
      permissions,
      declinedPermissions,
    } = await Facebook.logInWithReadPermissionsAsync('<APP_ID>', {
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

#
