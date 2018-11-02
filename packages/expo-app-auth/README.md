# expo-app-auth

This module provides access to the native OAuth library AppAuth by [OpenID](https://github.com/openid).

## Installation

### iOS (Cocoapods)

If you're using Cocoapods, add the dependency to your `Podfile`:

`pod 'EXAppAuth'`

and run `pod install`.

### iOS (no Cocoapods)

1. In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`
2. Go to `node_modules` ➜ `expo-app-auth` and add `EXContacts.xcodeproj`
3. In XCode, in the project navigator, select your project. Add `libEXContacts.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`
4. Run your project (`Cmd+R`).

### Android

1. Append the following lines to `android/settings.gradle`:

   ```gradle
   include ':expo-app-auth'
   project(':expo-app-auth').projectDir = new File(rootProject.projectDir, '../node_modules/expo-app-auth/android')
   ```

   and if not already included

   ```gradle
      include ':expo-constants-interface'
   project(':expo-constants-interface').projectDir = new File(rootProject.projectDir, '../node_modules/expo-constants-interface/android')
   ```

2. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
   ```gradle
   compile project(':expo-app-auth')
   ```
   and if not already included
   ```gradle
   compile project(':expo-constants-interface')
   ```
3. Include the module in your expo packages: `./android/app/src/main/java/host/exp/exponent/MainActivity.java`

   ```java
   /*
   * At the top of the file.
   * This is automatically imported with Android Studio, but if you are in any other editor you will need to manually import the module.
   */
   import expo.modules.appauth.AppAuthPackage;
   // Later in the file...
   @Override
   public List<Package> expoPackages() {
     // Here you can add your own packages.
     return Arrays.<Package>asList(
       new AppAuthPackage() // Include this.
     );
   }
   ```

# Methods

## `AppAuth.authorizeAsync(props: OAuthProps): Promise<object>`

Starts an OAuth flow and returns authorization credentials.

### Example

```js
const config = {
  issuer: 'https://accounts.google.com',
  clientId: '<CLIENT_ID>',
  scopes: ['profile'],
};

const authState = await AppAuth.authorizeAsync(config);
```

## `AppAuth.refreshAsync(props: OAuthProps, refreshToken: string): Promise<object>`

This will renew the authorization credentials (access token). Some providers may not return a new refresh token.

### Example

```js
const config = {
  issuer: 'https://accounts.google.com',
  clientId: '<CLIENT_ID>',
  scopes: ['profile'],
};

const authState = await AppAuth.refreshAsync(config, refreshToken);
```

## `AppAuth.revokeAsync(props: OAuthProps, options: OAuthRevokeOptions): Promise<object>`

A fully JS function which revokes the provided access or refresh token. Use this method for signing-out.

### Example

```js
const config = {
  issuer: 'https://accounts.google.com',
  clientId: '<CLIENT_ID>',
};

const options = {
  token: accessToken,
  isClientIdProvided: true,
};

// Sign out...
await AppAuth.revokeAsync(config, options);
```

# Constants

## `AppAuth.OAuthRedirect`

Redirect scheme used to assemble the `redirectUrl` prop.

## `AppAuth.URLSchemes`

> iOS only

A list of URL Schemes from the `info.plist`

# Types

## `OAuthProps`

### `issuer: string`

### `redirectUrl?: string`

- Default: `\`${AppAuth.OAuthRedirect}:/oauthredirect\``

### `clientId: string`

### `clientSecret?: string`

### `scopes?: Array<string>`

### `additionalParameters?: OAuthParameters`

### `canMakeInsecureRequests?: boolean`

### `serviceConfiguration?: OAuthServiceConfiguration`

## `OAuthRevokeOptions`

### `token: string`

### `isClientIdProvided: boolean`

## `OAuthServiceConfiguration`

### `revocationEndpoint?: string`

### `authorizationEndpoint?: string`

### `registrationEndpoint?: string`

### `tokenEndpoint: string`

## `OAuthParameters`

### `login_hint?: string`

Some auth providers (Google) allow for a `login_hint`, which provides information you already know about the user. For instance, say you know the user's email address is `bacon@expo.io` you could pass this as the hint and the provider will try and sign in to this account by default.

### `display?: string`

### `prompt?: string`

### `[string]: any`

Optionally you can include other parameters your OAuth provider accepts

# Full Example

```js
import { AsyncStorage } from 'react-native';
import { AppAuth } from 'expo-app-auth';

const config = {
  issuer: 'https://accounts.google.com',
  clientId: '603386649315-vp4revvrcgrcjme51ebuhbkbspl048l9.apps.googleusercontent.com',
  scopes: ['openid', 'profile'],
};

const StorageKey = '@Storage:Key';

async function signInAsync() {
  const authState = await AppAuth.authorizeAsync(config);
  await cacheAuthAsync(authState);
  console.log('signInAsync', authState);
  return authState;
}

async function refreshAuthAsync({ refreshToken }) {
  const authState = await AppAuth.refreshAsync(config, refreshToken);
  console.log('refresh', authState);
  await cacheAuthAsync(authState);
  return authState;
}

async function getCachedAuthAsync() {
  const value = await AsyncStorage.getItem(StorageKey);
  const authState = JSON.parse(value);
  console.log('getCachedAuthAsync', authState);
  if (authState) {
    if (checkIfTokenExpired(authState)) {
      return refreshAuthAsync(authState);
    } else {
      return authState;
    }
  }
}

function cacheAuthAsync(authState) {
  return AsyncStorage.setItem(StorageKey, JSON.stringify(authState));
}

function checkIfTokenExpired({ accessTokenExpirationDate }) {
  return new Date(accessTokenExpirationDate) < new Date();
}

async function signOutAsync({ accessToken }) {
  try {
    await AppAuth.revokeAsync(config, {
      token: accessToken,
      isClientIdProvided: true,
    });
    await AsyncStorage.removeItem(StorageKey);
    return null;
  } catch (error) {
    alert('Failed to revoke token: ' + error.message);
  }
}
```
