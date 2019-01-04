---
title: Google
---

Provides Google authentication integration for Expo apps, using either the native Google Sign In SDK (only in standalone apps) or a system web browser (not WebView, so credentials saved on the device can be re-used!).

You'll get an access token after a succesful login. Once you have the token, if you would like to make further calls to the Google API, you can use Google's [REST APIs](https://developers.google.com/apis-explorer/) directly through HTTP (using [fetch](https://facebook.github.io/react-native/docs/network.html#fetch), for example).

```javascript
// Example of using the Google REST API
async function getUserInfo(accessToken) {
  let userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
    headers: { Authorization: `Bearer ${accessToken}`},
  });

  return userInfoResponse;
}
```

## Usage

### `Expo.Google.logInAsync(options)`

Prompts the user to log into Google and grants your app permission to access some of their Google data, as specified by the scopes.

#### :param object options

 A map of options:

-   **behavior** (_string_) -- The type of behavior to use for login, either `web` or `system`. Native (`system`) can only be used inside of a standalone app when built using the steps described below. Default is `system` in standalone app. You need to specify `web` in Expo app or if you would prefer to use `web` inside of a standalone app.
-   **scopes** (_array_) -- An array specifying the scopes to ask for from Google for this login ([more information here](https://gsuite-developers.googleblog.com/2012/01/tips-on-using-apis-discovery-service.html)). Default scopes are `['profile', 'email']`.
-   **androidClientId** (_string_) -- The Android client id registered with Google for use in the Expo client app.
-   **iosClientId** (_string_) -- The iOS client id registered with Google for use in the Expo client app.
-   **androidStandaloneAppClientId** (_string_) -- The Android client id registered with Google for use in a standalone app.
-   **iosStandaloneAppClientId** (_string_) -- The iOS client id registered with Google for use in a standalone app.
-   **webClientId** (_string_) -- The web client id registered with Google to generate server tokens.

#### Returns

If the user or Google cancelled the login, returns `{ type: 'cancel' }`.

Otherwise, returns `{ type: 'success', accessToken, idToken, refreshToken, {...profileInformation} }`, `accessToken` is a string giving the access token to use with Google HTTP API requests.

_Please note that to have access to `accessToken`, `idToken` and `refreshToken` you need to pass `webClientId` for standalone apps._

## Using it inside of the Expo app

In the Expo client app, you can only use browser-based login (this works very well actually because it re-uses credentials saved in your system browser). If you build a standalone app, you can use the native login for the platform.

To use Google Sign In, you will need to create a project on the Google Developer Console and create an OAuth 2.0 client ID. This is, unfortunately, super annoying to do and we wish there was a way we could automate this for you, but at the moment the Google Developer Console does not expose an API. _You also need to register a separate set of Client IDs for a standalone app, the process for this is described later in this document_.

-   **Get an app set up on the Google Developer Console**

    -   Go to the [Credentials Page](https://console.developers.google.com/apis/credentials)
    -   Create an app for your project if you haven't already.
    -   Once that's done, click "Create Credentials" and then "OAuth client ID." You will be prompted to set the product name on the consent screen, go ahead and do that.

-   **Create an iOS OAuth Client ID**

    -   Select "iOS Application" as the Application Type. Give it a name if you want (e.g. "iOS Development").
    -   Use `host.exp.exponent` as the bundle identifier.
    -   Click "Create"
    -   You will now see a modal with the client ID.
    -   The client ID is used in the `iosClientId` option for `Expo.Google.loginAsync` (see code example below).

-   **Create an Android OAuth Client ID**

    -   Select "Android Application" as the Application Type. Give it a name if you want (maybe "Android Development").
    -   Run `openssl rand -base64 32 | openssl sha1 -c` in your terminal, it will output a string that looks like `A1:B2:C3` but longer. Copy the output to your clipboard.
    -   Paste the output from the previous step into the "Signing-certificate fingerprint" text field.
    -   Use `host.exp.exponent` as the "Package name".
    -   Click "Create"
    -   You will now see a modal with the Client ID.
    -   The client ID is used in the `androidClientId` option for `Expo.Google.loginAsync` (see code example below).

-   **Add the Client IDs to your app**

    ```javascript
    import Expo from 'expo';

    async function signInWithGoogleAsync() {
      try {
        const result = await Expo.Google.logInAsync({
          androidClientId: YOUR_CLIENT_ID_HERE,
          iosClientId: YOUR_CLIENT_ID_HERE,
          scopes: ['profile', 'email'],
        });

        if (result.type === 'success') {
          return result.accessToken;
        } else {
          return {cancelled: true};
        }
      } catch(e) {
        return {error: true};
      }
    }
    ```

## Deploying to a standalone app on Android

If you want to use Google Sign In for a standalone app, you can follow these steps. These steps assume that you already have it working on the Expo client app. If you have already created an API key for Google Maps, you skip steps 3 through 8, inclusive.

-   **Get a Google API Key for your app** (_skip this if you already have one, eg: for Google Maps_)
    1.  Build a standalone app and download the apk, or find one that you have already built.
    2.  Go to the [Google Developer Credentials](https://console.developers.google.com/apis/credentials)
    3.  Click **Create credentials**, then **API Key**, and finally click **RESTRICT KEY** in the modal that pops up.
    4.  Click the **Android apps** radio button under **Key restriction**, then click **+ Add package name and fingerprint**.
    5.  Add your `android.package` from `app.json` (eg: `ca.brentvatne.growlerprowler`) to the **Package name** field.
    6.  Run `expo fetch:android:hashes`.
    7.  Take `Google Certificate Fingerprint` from previous step and insert it in the **SHA-1 certificate fingerprint** field.
    8.  Press **Save**.
-   **Get an OAuth client ID for your app**
    1.  Build a standalone app and download the apk, or find one that you have already built.
    2.  Go to the [Google Developer Credentials](https://console.developers.google.com/apis/credentials).
    3.  Click **Create credentials**, then **OAuth client ID**, then select the **Android** radio button.
    4.  Run `expo fetch:android:hashes`.
    5.  Take `Google Certificate Fingerprint` from previous step and insert it in the **Signing-certificate fingerprint** field.
    6.  Add your `android.package` from `app.json` (eg: `ca.brentvatne.growlerprowler`) to the **Package name** field.
    7.  Press **Create**.
-   **Add the configuration to your app**
    1.  Build a standalone app and download the apk, or find one that you have already built.
    2.  Go to the [Google Developer Credentials](https://console.developers.google.com/apis/credentials) and find your API key.
    3.  Open `app.json` and add your **Google API Key** to `android.config.googleSignIn.apiKey`.
    4.  Run `expo fetch:android:hashes`.
    5.  Take `Google Certificate Hash` from the previous step to `app.json` under `android.config.googleSignIn.certificateHash`.
    6.  When you use `Expo.Google.logInAsync(..)`, pass in the **OAuth client ID** as the `androidStandaloneAppClientId` option.
    7.  Rebuild your standalone app.

Note that if you've enabled Google Play's app signing service, you will need to grab their app signing certificate in production rather than the upload certificate returned by `expo fetch:android:hashes`. You can do this by grabbing the signature from Play Console -> Your App -> Release management -> App signing, and then going to the [API Dashboard](https://console.developers.google.com/apis/) -> Credentials and adding the signature to your existing credential.

## Deploying to a standalone app on iOS

If you want to use native sign in for a standalone app, you can follow these steps. These steps assume that you already have it working on the Expo client app.

1.  Add a `bundleIdentifier` to your `app.json` if you don't already have one.
2.  Open your browser to [Google Developer Credentials](https://console.developers.google.com/apis/credentials)
3.  Click **Create credentials** and then **OAuth client ID**, then choose **iOS**.
4.  Provide your `bundleIdentifier` in the **Bundle ID** field, then press **Create**.
5.  Add the given **iOS URL scheme** to your `app.json` under `ios.config.googleSignIn.reservedClientId`.
6.  Wherever you use `Expo.Google.logInAsync`, provide the **OAuth client ID** as the `iosStandaloneAppClientId` option.
7.  Rebuild your standalone app.

## Server side APIs

If you need to access Google APIs using the user's authorization you need to pass an additional web client id. This will add accessToken, idToken, refreshToken and serverAuthCode to the response object that you can use on your server with the client id secret.

1.  Open your browser to [Google Developer Credentials](https://console.developers.google.com/apis/credentials)
2.  Click **Create credentials** and then **OAuth client ID**, then choose **web** and press **Create**.
-   **For Standalone apps**
Wherever you use `Expo.Google.logInAsync`, provide the **OAuth client ID** as the `webClientId` option.
-   **Inside of Expo apps**
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

