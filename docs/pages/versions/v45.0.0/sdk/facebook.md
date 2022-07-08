---
title: Facebook
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-45/packages/expo-facebook'
packageName: 'expo-facebook'
---

import { ConfigClassic, ConfigReactNative, ConfigPluginExample, ConfigPluginProperties } from '~/components/plugins/ConfigSection';
import { AndroidPermissions, IOSPermissions } from '~/components/plugins/permissions';
import APISection from '~/components/plugins/APISection';
import {APIInstallSection} from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import { Collapsible } from '~/ui/components/Collapsible';

> **Deprecated.** This module will be removed in SDK 46. There will be no replacement that works with the classic build service (`expo build`) because [the classic build service has been superseded by **EAS Build**](https://blog.expo.dev/turtle-goes-out-to-sea-d334db2a6b60). With **EAS Build** and [Development Builds](/development/introduction.md), you should use [react-native-fbsdk-next](https://github.com/thebergamo/react-native-fbsdk-next/#expo-installation) instead.

**`expo-facebook`** provides Facebook integration, such as logging in through Facebook, for React Native apps. Expo exposes a minimal native API since you can access Facebook's [Graph API](https://developers.facebook.com/docs/graph-api) directly through HTTP (using [fetch](https://reactnative.dev/docs/network.html#fetch), for example).

<PlatformsSection android emulator ios simulator />

## Installation

<APIInstallSection />

For bare apps, here are links to the [iOS Installation Walkthrough](https://developers.facebook.com/docs/ios/getting-started/#step-3---configure-your-project) and the [Android Installation Walkthrough](https://developers.facebook.com/docs/android/getting-started#app_id).

## Registering your app with Facebook

> 💡 When following these steps you will find on the Facebook Developer site that there are many fields and steps that you don't actually care about. Just look for the information that we ask you for and you will be OK!

Follow [Facebook's developer documentation](https://developers.facebook.com/docs/apps/register) to register an application with Facebook's API and get an application ID. Take note of this application ID because it will be used as the `appId` option in your [`Facebook.logInWithReadPermissionsAsync`](#expofacebookloginwithreadpermissionsasync 'Facebook.logInWithReadPermissionsAsync') call.

Then follow these steps based on the platforms you're targeting. This will need to be done from the [Facebook developer site](https://developers.facebook.com/).

Expo Go from the Android Play Store will use the Facebook App ID that you provide, however, all Facebook API calls in the **Expo Go from the iOS App Store will use Expo's own Facebook App ID**. This is due to underlying configuration limitations, but the good news is it means less setup for you! The downside to this is that you can't customize which permissions your app requests from Facebook (like `user_photos` or `user_friends`), or integrate Facebook login with other services like Firebase auth. If you need that functionality on iOS, you can build a standalone app. An easy way to test this is to [run a simulator build](/build-reference/simulators.md) and install the app in your simulator, or use [expo-dev-client](/development/introduction.md).

> You may have to switch the app from 'development mode' to 'public mode' on the Facebook developer page before other users can log in. This requires adding a privacy policy URL, which can be as simple as a GitHub Gist.

### iOS standalone app

Add your app's Bundle ID as a _Bundle ID_ in the app settings page pictured below. An easy way to test that this is set up correctly is to [run a simulator build](/build-reference/simulators.md).

<Collapsible summary="Screenshot of the Facebook developer page">

![](/static/images/facebook-app-settings.png)

</Collapsible>

### Android standalone app

- [Build your standalone app](/classic/building-standalone-apps) for Android.
- Run `eas credentials`, select the profile that you would like to generate the SHA-1 Fingerprint for, and press return.
- Take the resulting SHA1 Fingerprint and convert it to base64 (for example, [using base64.guru](https://base64.guru/converter/encode/hex)). The resulting base64 string is your "Facebook Key Hash".
- Configure the Facebook Key Hash on the Facebook developer page pictured below.

<Collapsible summary="Screenshot of the Facebook developer page">

![](/static/images/facebook-app-settings.png)

</Collapsible>

## Configuration in app.json / app.config.js

- Add the field `facebookScheme` with your Facebook login redirect URL scheme found [on the Facebook Developer website](https://developers.facebook.com/docs/facebook-login/ios) under "_4. Configure Your info.plist_." It should look like `"fb123456"`. If you do not do this, Facebook will not be able to redirect to your app after logging in.
- Add the fields `facebookAppId` and `facebookDisplayName`, using your [Facebook App ID and Facebook Display Name](https://developers.facebook.com/docs/facebook-login/ios), respectively.
- Optionally, add the following fields:
  - `facebookAutoLogAppEventsEnabled`, defaults to Facebook's default policy (Only applies to standalone apps)
  - `facebookAdvertiserIDCollectionEnabled`, defaults to Facebook's default policy (Only applies to standalone apps)

You can also configure `expo-facebook` using its built-in [config plugin](/guides/config-plugins.md) if you use config plugins in your project ([EAS Build](/build/introduction.md) or `expo run:[android|ios]`). The plugin allows you to configure various properties that cannot be set at runtime and require building a new app binary to take effect.

<ConfigClassic>

You can configure [the permissions for this library](#permissions) using [`ios.infoPlist`](../config/app.md#infoplist) and [`android.permissions`](../config/app.md#permissions).

</ConfigClassic>

<ConfigReactNative>

Learn how to configure the native projects in the [installation instructions in the `expo-facebook` repository](https://github.com/expo/expo/tree/main/packages/expo-facebook#installation-in-bare-react-native-projects).

</ConfigReactNative>

<ConfigPluginExample>

```json
{
  "expo": {
    "plugins": [
      [
        "expo-facebook",
        {
          "userTrackingPermission": false
        }
      ]
    ]
  }
}
```

</ConfigPluginExample>

<ConfigPluginProperties properties={[
{ name: 'userTrackingPermission', platform: 'ios', description: 'A string to set the NSUserTrackingUsageDescription permission message, or set to the boolean value false to omit the field entirely.', default: '"This identifier will be used to deliver personalized ads to you."' },
]} />

## Example

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
