---
title: Google
---

> As of SDK 32 `Expo.Google` is just a JS wrapper for the `Expo.AppAuth` library.

Provides Google authentication integration for Expo apps using a system web browser (not WebView, so credentials saved on the device can be re-used!).

You'll get an access token after a successful login. Once you have the token, if you would like to make further calls to the Google API, you can use Google's [REST APIs](https://developers.google.com/apis-explorer/) directly through HTTP (using [fetch](https://facebook.github.io/react-native/docs/network.html#fetch), for example).

In the [managed workflow](../../introduction/managed-vs-bare/#managed-workflow), native Google Sign-In functionality can be used only in standalone builds, not the Expo client. If you would like to use the native authentication flow, see [GoogleSignIn](../google-sign-in).

## Installation

The web browser-based authentication flow is provided by the `expo-app-auth` package, which is pre-installed installed in [managed](../../introduction/managed-vs-bare/#managed-workflow) apps. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow the [expo-app-auth installation instructions](https://github.com/expo/expo/tree/master/packages/expo-app-auth) and API reference.

## Usage

```javascript
// Example of using the Google REST API
async function getUserInfo(accessToken) {
  let userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return await userInfoResponse.json();
}
```

## API

```js
import { Google } from 'expo';
```

## Methods

### logInAsync

```js
logInAsync(config: LogInConfig): Promise<LogInResult>
```

This method uses `AppAuth` to authenticate; for even more native functionality see `expo-google-sign-in`.

Prompts the user to log into Google and grants your app permission to access some of their Google data, as specified by the scopes.
The difference between this method and native authentication are very sparce. Google has done a very good job at making the web auth flow work consistently. The biggest difference is that you cannot use `expo-google-sign-in` in the Expo client (standalone apps only), which makes `Expo.Google.logInAsync` your best solution for testing in development.

**Parameters**

| Name   | Type          | Description                               |
| ------ | ------------- | ----------------------------------------- |
| config | `LogInConfig` | Used to log into your Google application. |

**LogInConfig**

| Name                         | Type       | Description                                                                                                                                                                                                                          |
| ---------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| clientId                     | `string`   | **Web API key** that denotes the Google application to log in to                                                                                                                                                                     |
| scopes                       | `string[]` | An array specifying the scopes to ask for from Google for this login ([more information here](https://gsuite-developers.googleblog.com/2012/01/tips-on-using-apis-discovery-service.html)). Default scopes are `['profile', 'email'] |
| androidClientId              | `string`   | **DEPRECATED** use `clientId` instead                                                                                                                                                                                                |
| iosClientId                  | `string`   | **DEPRECATED** use `clientId` instead                                                                                                                                                                                                |
| androidStandaloneAppClientId | `string`   | **DEPRECATED** use `clientId` instead                                                                                                                                                                                                |
| iosStandaloneAppClientId     | `string`   | **DEPRECATED** use `clientId` instead                                                                                                                                                                                                |
| webClientId                  | `string`   | **DEPRECATED** use `clientId` instead                                                                                                                                                                                                |

**Returns**

| Name        | Type                   | Description                                      |
| ----------- | ---------------------- | ------------------------------------------------ |
| logInResult | `Promise<LogInResult>` | Resolves into the results of your login attempt. |

**LogInResult**

| Name         | Type                   | Description                                                  |
| ------------ | ---------------------- | ------------------------------------------------------------ |
| type         | `'cancel' | 'success'` | Denotes the summary of the user event.                       |
| accessToken  | `string | undefined`   | Used for accessing data from Google, invalidate to "log out" |
| idToken      | `string | null`        | ID token                                                     |
| refreshToken | `string | null`        | Refresh the other tokens.                                    |
| user         | `GoogleUser`           | An object with data regarding the authenticated user.        |

**GoogleUser**

| Name       | Type                 | Description                         |
| ---------- | -------------------- | ----------------------------------- |
| id         | `string | undefined` | optional ID for the user            |
| name       | `string | undefined` | optional name for the user          |
| givenName  | `string | undefined` | optional first name for the user    |
| familyName | `string | undefined` | optional last name for the user     |
| photoUrl   | `string | undefined` | optional photo for the user         |
| email      | `string | undefined` | optional email address for the user |

**Example**

```js
import { Google } from 'expo';

const clientId = '<YOUR_WEB_CLIENT_ID>';
const { type, accessToken, user } = await Google.logInAsync({ clientId });

if (type === 'success') {
  /* `accessToken` is now valid and can be used to get data from the Google API with HTTP requests */
  console.log(user);
}
```

### logOutAsync

```js
logOutAsync({ accessToken, clientId }): Promise<any>
```

Invalidates the provided `accessToken`, given the `clientId` used to sign-in is provided.
This method is an alias for the following functionality:

```js
import { AppAuth } from 'expo-app-auth';

async function logOutAsync({ accessToken, clientId }): Promise<any> {
  const config = {
    issuer: 'https://accounts.google.com',
    clientId,
  };

  return await AppAuth.revokeAsync(config, {
    token: accessToken,
    isClientIdProvided: !!clientId,
  });
}
```

**Parameters**

| Name    | Type                                        | Description                                |
| ------- | ------------------------------------------- | ------------------------------------------ |
| options | `{ accessToken: string, clientId: string }` | Used to log out of the Google application. |

**options**

| Name        | Type     | Description                                                        |
| ----------- | -------- | ------------------------------------------------------------------ |
| accessToken | `string` | Provided when the user authenticates with your Google application. |
| clientId    | `string` | Used to identify the corresponding application.                    |

**Example**

```js
import { Google } from 'expo';

const clientId = '<YOUR_WEB_CLIENT_ID>';
const { type, accessToken } = await Google.logInAsync({ clientId });

if (type === 'success') {
  /* Log-Out */
  await Google.logOutAsync({ clientId, accessToken });
  /* `accessToken` is now invalid and cannot be used to get data from the Google API with HTTP requests */
}
```

## Using it inside of the Expo app

In the Expo client app, you can only use browser-based login (this works very well actually because it re-uses credentials saved in your system browser). If you build a standalone app, you can use the native login with the package `expo-google-sign-in`.

To use Google Sign In, you will need to create a project in Firebase (or on the Google Developer Console).
In Firebase create a project, then enable Google Sign-In in the Authentication tab on the left side of the page.

## Server side APIs

If you need to access Google APIs using the user's authorization you need to pass an additional web client id. This will add accessToken, idToken, refreshToken and serverAuthCode to the response object that you can use on your server with the client id secret.

1.  Open your browser to [Google Developer Credentials](https://console.developers.google.com/apis/credentials)
2.  Click **Create credentials** and then **OAuth client ID**, then choose **web** and press **Create**.

When your app is running as an Expo experience, the process is a little different. Due to Google's restrictions, the only way to make this work is via web authentication flow. Once you have your code, send it to your backend and exchange it, but make sure to set the redirect_uri parameter to the same value you used on your client side call to Google.
(Something similar to https://auth.expo.io/@username/your-app-slug). With Expo, you can easily authenticate your user with the `AuthSession` module:

```javascript
let result = await Expo.AuthSession.startAsync({
  authUrl:
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `&client_id=${googleWebAppId}` +
    `&redirect_uri=${encodeURIComponent(redirectUrl)}` +
    `&response_type=code` +
    `&access_type=offline` +
    `&scope=profile`,
});
```

