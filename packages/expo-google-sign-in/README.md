# expo-google-sign-in

> This library is a part of Expo v32+ but cannot be used in the Expo Client

`expo-google-sign-in` enables native Google authentication features in your app!
This module can only be used in ExpoKit, or a Standalone Expo app.

## Installation

You need to install the package from `npm` registry.

`npm install expo-google-sign-in` or `yarn add expo-google-sign-in`

#### iOS

If you're using Cocoapods, add the dependency to your `Podfile`:

```ruby
pod 'EXGoogleSignIn', path: '../node_modules/expo-google-sign-in/ios'
```

and run `pod install`.

The `clientId` of the app from the Google APIs (or Firebase) console, must be set in `GoogleSignIn.initAsync({ clientId: <CLIENT_ID> })` for sign-in to work. Normally this value would be defined at build time in the `GoogleService-info.plist`.

You will also need to define a custom URL scheme for `Google Sign-In` to handle the returned data.

**If this step is skipped you should see an error: `"Exception 'Your app is missing support for the following URL schemes: com.googleusercontent.apps.{{CLIENT_ID}}' ...`**

This can be done in the app.json, the value should be your `REVERSED_CLIENT_ID` iOS:

```js
{
 ...
 "ios": {
   "infoPlist": {
     "CFBundleURLTypes": [{
     "CFBundleTypeRole": "Editor",
     "CFBundleURLName": "Google Auth",
     "CFBundleURLSchemes": [
       "firebase.reverse.id" // ex: "com.googleusercontent.apps.603386649315-vp4revvrcgrcjme51ebuhbkbspl048l9"
      ]
    }]
  }
}
```

#### Android

1.  Append the following lines to `android/settings.gradle`:

    ```gradle
    include ':expo-core'
    project(':expo-core').projectDir = new File(rootProject.projectDir, '../node_modules/expo-core/android')

    include ':expo-google-sign-in'
    project(':expo-google-sign-in').projectDir = new File(rootProject.projectDir, '../node_modules/expo-google-sign-in/android')
    ```

2.  Insert the following lines inside the dependencies block in `android/app/build.gradle`:

    ```gradle
    api project(':expo-core')

    api project(':expo-google-sign-in')
    ```

3.  In order to access this module from Expo, you will need to include it in the `expoPackages` export:
    `./android/app/src/main/java/host/exp/exponent/MainActivity.java`
    ```java
    @Override
    public List<Package> expoPackages() {
        // Here you can add your own packages.
        return Arrays.<Package>asList(
            new GoogleSignInPackage() // Include this.
        );
    }
    ```
4.  The client ID of the app from the Google APIs (or Firebase) console, must be set for sign-in to work. This value must be defined in the `google-services.json` on Android, you can define include your custom `google-services.json` in the `app.json` before creating a Standalone app like so:
    ```json
    {
     ...
     "android": {
       "googleServicesFile": "./google-services.json",
       ...
      }
    }
    ```

## Methods

### `getPlayServiceAvailability(shouldAsk: boolean = false): Promise<boolean>`

> Android Only, this method always returns true on iOS

Use this method to determine if a user's device can utilize Google Sign-In functionality.
By default this method will assume the option is `false` and silently check the play services, whereas passing `true` will present a modal if the Play Services aren't available.

### `askForPlayServicesAsync(): Promise<boolean>`

> Android Only, this method always returns true on iOS

A convenience wrapper for `getPlayServiceAvailability(true)`, this method will present a modal for the user to update Play Services if they aren't already up-to-date.

Returns true after the user successfully updates.

### `initAsync(options: ?GoogleSignInOptions): Promise`

Configures how the `GoogleSignIn` module will attempt to sign-in. You can call this method multiple times.

See all the available options under the `GoogleSignInOptions` type.

### `isSignedInAsync(): Promise<boolean>`

Asynchronously returns a boolean representing the user's authentication status.

### `signInSilentlyAsync(): Promise<?GoogleUser>`

This method will attempt to reauthenticate the user without initializing the authentication flow. If the method is successful, the currently authenticated `GoogleUser` will be returned, otherwise the method will return `null`.

### `signInAsync(): Promise<?GoogleSignInAuthResult>`

Starts the native authentication flow with the information provided in `initAsync()`.
If a user cancels, the method will return `{ type: 'cancel', user: null }`. However if a user successfully finishes the authentication flow, the returned value will be: `{ type: 'success', user: GoogleUser }`.

There are some errors that can be thrown while authenticating, check `GoogleSignIn.ERRORS` for available error codes.

### `signOutAsync(): Promise`

Signs-out the currently authenticated user. Unlike `disconnectAsync()`, this method will not revoke the access token. This means you can specifiy the `accountName` and reauthenticate without extra user approval.

### `isConnectedAsync(): Promise<boolean>`

Returns true if a user is authenticated and the access token has not been invalidated.

### `disconnectAsync(): Promise`

Signs-out the current user out and revokes the access tokens associated with the account. This will prevent reauthentication, whereas `signOutAsync()` will not.

### `getCurrentUserAsync(): Promise<GoogleUser | null>`

If a user is authenticated, this method will return all the basic profile information in the form of a `GoogleUser`.

### `getCurrentUser(): GoogleUser | null`

Get the most recent instance of the authenticated `GoogleUser`.

### `getPhotoAsync(size: number = 128): Promise<?string>`

Returns an image URI for the currently authenticated user. This method will return `null` if no user is signed in, or if the current user doesn't have a profile image on Google.
The default size is `128px`, if the requested image size is larger than the original image size, the full sized image will be returned.

## Types

```js
/* Android Only */
type GoogleSignInType = 'default' | 'games';
```

```js
type GoogleSignInOptions = {
  /*
   * [iOS][Android][optional]: `accountName: ?string`
   * [default]: `[GoogleSignIn.SCOPES.PROFILE, GoogleSignIn.SCOPES.EMAIL]`
   * Pass the scopes you wish to have access to.
   */
  scopes: ?Array<string>,

  /*
   * [iOS][Android][optional]: `webClientId: ?string`
   * [default]: `undefined`
   * The client ID of the home web server.  This will be returned as the |audience| property of the
   * OpenID Connect ID token.  For more info on the ID token:
   * https://developers.google.com/identity/sign-in/ios/backend-auth
   */
  webClientId: ?string,

  /*
   * [iOS][Android][optional]: `hostedDomain: ?string`
   * [default]: `undefined`
   * The hosted G Suite domain of the user. Provided only if the user belongs to a hosted domain
   */
  hostedDomain: ?string,

  /*
   * [iOS][Android][optional]: `accountName: ?string`
   * [default]: `undefined`
   * If you know the user's email address ahead of time, you can add it here and it will be the default option
   * if the user has approved access for this app, the Auth will return instantly.
   */
  accountName: ?string,

  /*
   * [Android][optional]: `signInType?: GoogleSignIn.TYPES.DEFAULT | GoogleSignIn.TYPES.GAMES`
   * [default]: `undefined`
   * The service you wish to sign-in to
   * GoogleSignIn.TYPES.DEFAULT | GoogleSignIn.TYPES.GAMES
   */
  signInType: ?GoogleSignInType,

  /*
   * [Android][optional]: `isOfflineEnabled: ?boolean`
   * [default]: `undefined`
   * If true, the server will return refresh tokens that can be used to access data when the user has unauthenticated.
   * 1. Safely secure the refresh token as you can only get one during the initial auth flow.
   * 2. There are only so many refresh tokens that are issued, limit per user/app, you can also get one for a single user across all clients in an app. If you requests too many tokens, older tokens will begin to be invalidated.
   */
  isOfflineEnabled: ?boolean,

  /*
   * [Android][optional]: `isPromptEnabled: ?boolean`
   * [default]: false
   * Forces the consent prompt to be shown everytime a user authenticates. Enable this only when necessary.
   */
  isPromptEnabled: ?boolean,

  /*
   * [iOS][optional]: `clientId: ?string`
   * [default]: Read from GoogleService-info.plist `CLIENT_ID` on iOS, and google-services.json `oauth_client.client_id` on Android.
   * The client ID of the app from the Google APIs (or Firebase) console, this must be set for sign-in to work.
   * This value must be defined in the google-services.json on Android, you can define your custom google-services.json
   */
  clientId: ?string,

  /*
   * [iOS][optional]: `language: ?string`
   * [default]: `undefined`
   * The language for sign-in, in the form of ISO 639-1 language code optionally followed by a dash
   * and ISO 3166-1 alpha-2 region code, such as |@"it"| or |@"pt-PT"|. Only set if different from
   * system default.
   */
  language: ?string,

  /*
   * [iOS][optional]: `openIdRealm?: ?string`
   * [default]: `undefined`
   * The OpenID2 realm of the home web server. This allows Google to include the user's OpenID
   * Identifier in the OpenID Connect ID token..
   */
  openIdRealm: ?string,
};
```

```js
type GoogleSignInAuthResultType = 'success' | 'cancel';
```

```js
type GoogleSignInAuthResult = {
  type: GoogleSignInAuthResultType,
  user: ?User,
};
```

## Classes

### `GoogleAuthData`

The base class for `GoogleSignIn` authentication data. This method enables you to compare and serialize objects.

**Methods:**

- `equals(other: ?any): boolean`
- `toJSON(): object`

### `GoogleIdentity`

Extends `GoogleAuthData`, core management of user data.

**Variables:**

- `uid: string;`
- `email: string;`
- `displayName: ?string;`
- `photoURL: ?string;`
- `firstName: ?string;`
- `lastName: ?string;`

### `GoogleUser`

Extends `GoogleIdentity`, manaages all data regarding an authenticated user.

**Variables:**

- `auth: ?Authentication;`
- `scopes: Array<string>;`
- `hostedDomain: ?string;`
- `serverAuthCode: ?string;`

**Methods:**

- `clearCache(): void`
- `getHeaders(): Promise<{ [string]: string }>`
- `refreshAuth(): Promise<?GoogleAuthentication>`

### `GoogleAuthentication`

Extends `GoogleAuthData`, manages the user tokens.

**Variables:**

- `clientId: ?string;`
- `accessToken: ?string;`
- `accessTokenExpirationDate: ?number;`
- `refreshToken: ?string;`
- `idToken: ?string;`
- `idTokenExpirationDate: ?number;`

## Constants

### `GoogleSignIn.ERRORS`

All of the available authentication error codes.

- `GoogleSignIn.ERRORS.SIGN_IN_CANCELLED` The user has cancelled the auth flow
- `GoogleSignIn.ERRORS.SIGN_IN_REQUIRED` Attempting to access user data before any user has been authenticated
- `GoogleSignIn.ERRORS.TASK_IN_PROGRESS` An existing auth task is already running.
- `GoogleSignIn.ERRORS.SIGN_IN_EXCEPTION` A general error has occurred
- `GoogleSignIn.ERRORS.SIGN_IN_FAILED` A Play Services error has occured (Android only)
- `GoogleSignIn.ERRORS.INVALID_ACCOUNT` An invalid account has been provided with `accountName` (Android only)
- `GoogleSignIn.ERRORS.SIGN_IN_NETWORK_ERROR` An issue with the internet connection has caused the auth task to fail (Android only)

### `GoogleSignIn.SCOPES`

- `GoogleSignIn.SCOPES.PROFILE`
- `GoogleSignIn.SCOPES.EMAIL`
- `GoogleSignIn.SCOPES.OPEN_ID`
- `GoogleSignIn.SCOPES.PLUS_ME`
- `GoogleSignIn.SCOPES.GAMES`
- `GoogleSignIn.SCOPES.GAMES_LITE`
- `GoogleSignIn.SCOPES.CLOUD_SAVE`
- `GoogleSignIn.SCOPES.APP_STATE`
- `GoogleSignIn.SCOPES.DRIVE_FILE`
- `GoogleSignIn.SCOPES.DRIVE_APPFOLDER`
- `GoogleSignIn.SCOPES.DRIVE_FULL`
- `GoogleSignIn.SCOPES.DRIVE_APPS`
- `GoogleSignIn.SCOPES.FITNESS_ACTIVITY_READ`
- `GoogleSignIn.SCOPES.FITNESS_ACTIVITY_READ_WRITE`
- `GoogleSignIn.SCOPES.FITNESS_LOCATION_READ`
- `GoogleSignIn.SCOPES.FITNESS_LOCATION_READ_WRITE`
- `GoogleSignIn.SCOPES.FITNESS_BODY_READ`
- `GoogleSignIn.SCOPES.FITNESS_BODY_READ_WRITE`
- `GoogleSignIn.SCOPES.FITNESS_NUTRITION_READ`
- `GoogleSignIn.SCOPES.FITNESS_NUTRITION_READ_WRITE`
- `GoogleSignIn.SCOPES.FITNESS_BLOOD_PRESSURE_READ`
- `GoogleSignIn.SCOPES.FITNESS_BLOOD_PRESSURE_READ_WRITE`
- `GoogleSignIn.SCOPES.FITNESS_BLOOD_GLUCOSE_READ`
- `GoogleSignIn.SCOPES.FITNESS_BLOOD_GLUCOSE_READ_WRITE`
- `GoogleSignIn.SCOPES.FITNESS_OXYGEN_SATURATION_READ`
- `GoogleSignIn.SCOPES.FITNESS_OXYGEN_SATURATION_READ_WRITE`
- `GoogleSignIn.SCOPES.FITNESS_BODY_TEMPERATURE_READ`
- `GoogleSignIn.SCOPES.FITNESS_BODY_TEMPERATURE_READ_WRITE`
- `GoogleSignIn.SCOPES.FITNESS_REPRODUCTIVE_HEALTH_READ`
- `GoogleSignIn.SCOPES.FITNESS_REPRODUCTIVE_HEALTH_READ_WRITE`

### `GoogleSignIn.TYPES`

All of the available sign-in types.

- `GoogleSignIn.TYPES.DEFAULT` The standard login method.
- `GoogleSignIn.TYPES.GAMES` Sign-in to Google Play Games (Android only)

## Usage

```javascript
import React from 'react';
import { View } from 'react-native';
import { GoogleSignIn } from 'expo-google-sign-in';

export default class AuthScreen extends React.Component {
  initAsync = async () => {
    await GoogleSignIn.initAsync({
      clientId: '603386649315-vp4revvrcgrcjme51ebuhbkbspl048l9.apps.googleusercontent.com',
    });
    this._syncUserWithStateAsync();
  };

  _syncUserWithStateAsync = async () => {
    const user = await GoogleSignIn.signInSilentlyAsync();
    this.setState({ user });
  };

  signOutAsync = async () => {
    await GoogleSignIn.signOutAsync();
    this.setState({ user: null });
  };

  signInAsync = async () => {
    try {
      await GoogleSignIn.askForPlayServicesAsync();
      const { type, user } = await GoogleSignIn.signInAsync();
      if (type === 'success') {
        this._syncUserWithStateAsync();
      }
    } catch ({ message }) {
      alert('login: Error:' + message);
    }
  };

  render() {
    return <View />;
  }
}
```
