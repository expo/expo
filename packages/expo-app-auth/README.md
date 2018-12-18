# expo-app-auth

> This library is a part of Expo v32+

This module provides access to the native OAuth library AppAuth by [OpenID](https://github.com/openid).

## Installation

This module is provided by default in the Expo suite. You will only need to install this outside of Expo.

But you can also install it in a vanilla React Native project using the following instructions.

**important**

You'll need to install the thin providers [`expo-core`](https://github.com/expo/expo/tree/master/packages/expo-core) & [`expo-react-native-adapter`](https://github.com/expo/expo/tree/master/packages/expo-react-native-adapter) which bind this code to React Native.
This module could be used in Flutter for instance, given the dart API was written as well.

### iOS (Cocoapods)

If you're using Cocoapods, add the dependency to your `Podfile`:

`pod 'EXAppAuth'`

and run `pod install`.

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
   * This is automatically imported with Android Studio, but if
   * you are in any other editor you will need to manually import the module.
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

# Documentation

Import the module like so:

```js
import { AppAuth } from 'expo-app-auth';

// or (Expo only)

import { AppAuth } from 'expo';
```

## Methods

### `authAsync`

```js
AppAuth.authAsync(props: OAuthProps): Promise<TokenResponse>
```

Starts an OAuth flow and returns authorization credentials.

#### Parameters

| Name  | Type         | Description                      |
| ----- | ------------ | -------------------------------- |
| props | `OAuthProps` | Configuration for the OAuth flow |

#### Return

| Name          | Type                     | Description                  |
| ------------- | ------------------------ | ---------------------------- |
| tokenResponse | `Promise<TokenResponse>` | Authenticated response token |

#### Example

```js
const config = {
  issuer: 'https://accounts.google.com',
  clientId: '<CLIENT_ID>',
  scopes: ['profile'],
};

const tokenResponse = await AppAuth.authAsync(config);
```

### `refreshAsync`

```js
AppAuth.refreshAsync(props: OAuthProps, refreshToken: string): Promise<TokenResponse>
```

Renew the authorization credentials (access token). Some providers may not return a new refresh token.

#### Parameters

| Name         | Type         | Description                                   |
| ------------ | ------------ | --------------------------------------------- |
| props        | `OAuthProps` | Configuration for the OAuth flow              |
| refreshToken | `string`     | Refresh token to exchange for an Access Token |

#### Return

| Name          | Type                     | Description                             |
| ------------- | ------------------------ | --------------------------------------- |
| tokenResponse | `Promise<TokenResponse>` | Refreshed authentication response token |

#### Example

```js
const config = {
  issuer: 'https://accounts.google.com',
  clientId: '<CLIENT_ID>',
  scopes: ['profile'],
};

const tokenResponse = await AppAuth.refreshAsync(config, refreshToken);
```

### `revokeAsync`

```js
AppAuth.revokeAsync(props: OAuthBaseProps, options: OAuthRevokeOptions): Promise<any>
```

A fully JS function which revokes the provided access token or refresh token.
Use this method for signing-out. Returns a fetch request.

#### Parameters

| Name    | Type                 | Description                                             |
| ------- | -------------------- | ------------------------------------------------------- |
| props   | `OAuthBaseProps`     | The same OAuth configuratiton used for the initial flow |
| options | `OAuthRevokeOptions` | Refresh token or access token to revoke                 |

### Example

```js
const config = {
  issuer: 'https://accounts.google.com',
  clientId: '<CLIENT_ID>',
};

const options = {
  token: accessToken, // or a refreshToken
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

## `TokenResponse`

Return value of the following `AppAuth` methods:

- `authAsync`
- `refreshAsync`

| Name                      | Type                       | Description                                                                               |
| ------------------------- | -------------------------- | ----------------------------------------------------------------------------------------- |
| accessToken               | `string | null`            | Access token generated by the auth server                                                 |
| accessTokenExpirationDate | `string | null`            | Approximate expiration date and time of the access token                                  |
| additionalParameters      | `{ [string]: any } | null` | Additional parameters returned from the auth server                                       |
| idToken                   | `string | null`            | ID Token value associated with the authenticated session                                  |
| tokenType                 | `string | null`            | Typically "Bearer" when defined or a value the client has negotiated with the auth Server |
| refreshToken              | `string | undefined`       | The most recent refresh token received from the auth server                               |

## `OAuthBaseProps`

| Name                                                                                                                               | Type                        | Description                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| clientId                                                                                                                           | `string`                    | The client identifier                                                                                       |
| [issuer](http://openid.github.io/AppAuth-iOS/docs/latest/interface_o_i_d_service_discovery.html#a7bd40452bb3a0094f251934fd85a8fd6) | `string`                    | URL using the https scheme with no query or fragment component that the OP asserts as its Issuer Identifier |
| serviceConfiguration                                                                                                               | `OAuthServiceConfiguration` | specifies how to connect to a particular OAuth provider                                                     |

## `OAuthProps`

extends `OAuthBaseProps`, is used to create OAuth flows.

| Name                                                                                                                               | Type                        | Description                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| clientId                                                                                                                           | `string`                    | The client identifier                                                                                       |
| [issuer](http://openid.github.io/AppAuth-iOS/docs/latest/interface_o_i_d_service_discovery.html#a7bd40452bb3a0094f251934fd85a8fd6) | `string`                    | URL using the https scheme with no query or fragment component that the OP asserts as its Issuer Identifier |
| serviceConfiguration                                                                                                               | `OAuthServiceConfiguration` | specifies how to connect to a particular OAuth provider                                                     |
| clientSecret                                                                                                                       | `string | undefined`        | used to prove that identity of the client when exchaning an authorization code for an access token          |
| [scopes](https://tools.ietf.org/html/rfc6749#section-3.3)                                                                          | `Array<string> | undefined` | a list of space-delimited, case-sensitive strings define the scope of the access requested                  |
| redirectUrl                                                                                                                        | `string | undefined`        | The client's redirect URI. Default: `\`\${AppAuth.OAuthRedirect}:/oauthredirect\``                          |
| [additionalParameters](https://tools.ietf.org/html/rfc6749#section-3.1)                                                            | `OAuthParameters`           | Extra props passed to the OAuth server request                                                              |
| canMakeInsecureRequests                                                                                                            | `boolean | undefined`       | **Android: Only** enables the use of HTTP requests                                                          |

## `OAuthRevokeOptions`

| Name               | Type      | Description                                                        |
| ------------------ | --------- | ------------------------------------------------------------------ |
| token              | `string`  | The access token or refresh token to revoke                        |
| isClientIdProvided | `boolean` | Denotes the availability of the Client ID for the token revocation |

## `OAuthServiceConfiguration`

| Name                                                                                                                                             | Type                 | Description                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- | ------------------------------------------------------------- |
| [authorizationEndpoint](https://openid.net/specs/openid-connect-core-1_0.html#AuthorizationEndpoint)                                             | `string | undefined` | Optional URL of the OP's OAuth 2.0 Authorization Endpoint     |
| [registrationEndpoint](http://openid.github.io/AppAuth-iOS/docs/latest/interface_o_i_d_service_discovery.html#ab6a4608552978d3bce67b93b45321555) | `string | undefined` | Optional URL of the OP's Dynamic Client Registration Endpoint |
| revocationEndpoint                                                                                                                               | `string | undefined` | Optional URL of the OAuth server used for revoking tokens     |
| tokenEndpoint                                                                                                                                    | `string`             | URL of the OP's OAuth 2.0 Token Endpoint                      |

## `OAuthParameters`

Learn more about OAuth Parameters on this exciting page: [openid-connect-core](https://openid.net/specs/openid-connect-core-1_0.html).
To save time I've copied over some of the relevant information, which you can find below.

| Name          | Type                                    |
| ------------- | --------------------------------------- |
| nonce         | `OAuthNonceParameter | undefined`       |
| display       | `OAuthParametersDisplay | undefined`    |
| prompt        | `OAuthPromptParameter | undefined`      |
| max_age       | `OAuthMaxAgeParameter | undefined`      |
| ui_locales    | `OAuthUILocalesParameter | undefined`   |
| id_token_hint | `OAuthIDTokenHintParameter | undefined` |
| login_hint    | `OAuthLoginHintParameter | undefined`   |
| acr_values    | `OAuthACRValuesParameter | undefined`   |

Other parameters MAY be sent. See Sections [3.2.2](https://openid.net/specs/openid-connect-core-1_0.html#ImplicitAuthorizationEndpoint), [3.3.2](https://openid.net/specs/openid-connect-core-1_0.html#HybridAuthorizationEndpoint), [5.2](https://openid.net/specs/openid-connect-core-1_0.html#ClaimsLanguagesAndScripts), [5.5](https://openid.net/specs/openid-connect-core-1_0.html#ClaimsParameter), [6](https://openid.net/specs/openid-connect-core-1_0.html#JWTRequests), and [7.2.1](https://openid.net/specs/openid-connect-core-1_0.html#RegistrationParameter) for additional Authorization Request parameters and parameter values defined by this specification.

## [`OAuthDisplayParameter`](https://openid.net/specs/openid-connect-core-1_0.html)

```js
type OAuthDisplayParameter = 'page' | 'popup' | 'touch' | 'wap';
```

ASCII string value that specifies how the Authorization Server displays the authentication and consent user interface pages to the End-User.

| Value   | Description                                                                                                                                                                                                                                                                       |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page`  | The Authorization Server SHOULD display the authentication and consent UI consistent with a full User Agent page view. If the display parameter is not specified, this is the default display mode.                                                                               |
| `popup` | The Authorization Server SHOULD display the authentication and consent UI consistent with a popup User Agent window. The popup User Agent window should be of an appropriate size for a login-focused dialog and should not obscure the entire window that it is popping up over. |
| `touch` | The Authorization Server SHOULD display the authentication and consent UI consistent with a device that leverages a touch interface.                                                                                                                                              |
| `wap`   | The Authorization Server SHOULD display the authentication and consent UI consistent with a "feature phone" type display.                                                                                                                                                         |

The Authorization Server MAY also attempt to detect the capabilities of the User Agent and present an appropriate display.

## [`OAuthPromptParameter`](https://openid.net/specs/openid-connect-core-1_0.html)

```js
type OAuthPromptParameter = 'none' | 'login' | 'consent' | 'select_account';
```

Space delimited, case sensitive list of ASCII string values that specifies whether the Authorization Server prompts the End-User for reauthentication and consent.

| Value            | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `none`           | The Authorization Server MUST NOT display any authentication or consent user interface pages. An error is returned if an End-User is not already authenticated or the Client does not have pre-configured consent for the requested Claims or does not fulfill other conditions for processing the request. The error code will typically be `login_required`, `interaction_required`, or another code defined in [Section 3.1.2.6](https://openid.net/specs/openid-connect-core-1_0.html#AuthError). This can be used as a method to check for existing authentication and/or consent. |
| `login`          | The Authorization Server SHOULD prompt the End-User for reauthentication. If it cannot reauthenticate the End-User, it MUST return an error, typically `login_required`.                                                                                                                                                                                                                                                                                                                                                                                                                |
| `consent`        | The Authorization Server SHOULD prompt the End-User for consent before returning information to the Client. If it cannot obtain consent, it MUST return an error, typically `consent_required`.                                                                                                                                                                                                                                                                                                                                                                                         |
| `select_account` | The Authorization Server SHOULD prompt the End-User to select a user account. This enables an End-User who has multiple accounts at the Authorization Server to select amongst the multiple accounts that they might have current sessions for. If it cannot obtain an account selection choice made by the End-User, it MUST return an error, typically `account_selection_required`.                                                                                                                                                                                                  |

The `prompt` parameter can be used by the Client to make sure that the End-User is still present for the current session or to bring attention to the request. If this parameter contains `none` with any other value, an error is returned.

## [`OAuthNonceParameter`](https://openid.net/specs/openid-connect-core-1_0.html)

```js
type OAuthNonceParameter = string;
```

String value used to associate a Client session with an ID Token, and to mitigate replay attacks. The value is passed through unmodified from the Authentication Request to the ID Token. Sufficient entropy MUST be present in the `nonce` values used to prevent attackers from guessing values. For implementation notes, see [Section 15.5.2](https://openid.net/specs/openid-connect-core-1_0.html#NonceNotes).

## [`OAuthNonceParameter`](https://openid.net/specs/openid-connect-core-1_0.html)

```js
type OAuthNonceParameter = string;
```

String value used to associate a Client session with an ID Token, and to mitigate replay attacks. The value is passed through unmodified from the Authentication Request to the ID Token. Sufficient entropy MUST be present in the `nonce` values used to prevent attackers from guessing values. For implementation notes, see [Section 15.5.2](https://openid.net/specs/openid-connect-core-1_0.html#NonceNotes).

## [`OAuthUILocalesParameter`](https://openid.net/specs/openid-connect-core-1_0.html)

```js
type OAuthUILocalesParameter = string;
```

End-User's preferred languages and scripts for the user interface, represented as a space-separated list of [BCP47](https://openid.net/specs/openid-connect-core-1_0.html#RFC5646) [RFC5646] language tag values, ordered by preference. For instance, the value "fr-CA fr en" represents a preference for French as spoken in Canada, then French (without a region designation), followed by English (without a region designation). An error SHOULD NOT result if some or all of the requested locales are not supported by the OpenID Provider.

## [`OAuthIDTokenHintParameter`](https://openid.net/specs/openid-connect-core-1_0.html)

```js
type OAuthIDTokenHintParameter = string;
```

ID Token previously issued by the Authorization Server being passed as a hint about the End-User's current or past authenticated session with the Client. If the End-User identified by the ID Token is logged in or is logged in by the request, then the Authorization Server returns a positive response; otherwise, it SHOULD return an error, such as login_required. When possible, an `id_token_hint` SHOULD be present when `prompt=none` is used and an `invalid_request` error MAY be returned if it is not; however, the server SHOULD respond successfully when possible, even if it is not present. The Authorization Server need not be listed as an audience of the ID Token when it is used as an `id_token_hint` value.
If the ID Token received by the RP from the OP is encrypted, to use it as an `id_token_hint`, the Client MUST decrypt the signed ID Token contained within the encrypted ID Token. The Client MAY re-encrypt the signed ID token to the Authentication Server using a key that enables the server to decrypt the ID Token, and use the re-encrypted ID token as the `id_token_hint` value.

## [`OAuthMaxAgeParameter`](https://openid.net/specs/openid-connect-core-1_0.html)

```js
type OAuthMaxAgeParameter = string;
```

Maximum Authentication Age. Specifies the allowable elapsed time in seconds since the last time the End-User was actively authenticated by the OP. If the elapsed time is greater than this value, the OP MUST attempt to actively re-authenticate the End-User. (The `max_age` request parameter corresponds to the OpenID 2.0 [PAPE](https://openid.net/specs/openid-connect-core-1_0.html#OpenID.PAPE) [OpenID.PAPE] `max_auth_age` request parameter.) When `max_age` is used, the ID Token returned MUST include an `auth_time` Claim Value.

## [`OAuthLoginHintParameter`](https://openid.net/specs/openid-connect-core-1_0.html)

```js
type OAuthLoginHintParameter = string;
```

OPTIONAL. Hint to the Authorization Server about the login identifier the End-User might use to log in (if necessary). This hint can be used by an RP if it first asks the End-User for their e-mail address (or other identifier) and then wants to pass that value as a hint to the discovered authorization service. It is RECOMMENDED that the hint value match the value used for discovery. This value MAY also be a phone number in the format specified for the `phone_number` Claim. The use of this parameter is left to the OP's discretion.

## [`OAuthACRValuesParameter`](https://openid.net/specs/openid-connect-core-1_0.html)

```js
type OAuthACRValuesParameter = string;
```

Requested Authentication Context Class Reference values. Space-separated string that specifies the acr values that the Authorization Server is being requested to use for processing this Authentication Request, with the values appearing in order of preference. The Authentication Context Class satisfied by the authentication performed is returned as the acr Claim Value, as specified in Section 2. The acr Claim is requested as a Voluntary Claim by this parameter.

# Usage

Below is a set of example functions that demonstrate how to use `expo-app-auth` with the Google OAuth Sign-In provider.

```js
import { AsyncStorage } from 'react-native';
import { AppAuth } from 'expo-app-auth';
/* 
// or from expo directly...
import { AppAuth } from 'expo';
*/

const config = {
  issuer: 'https://accounts.google.com',
  scopes: ['openid', 'profile'],
  /* This is the CLIENT_ID generated from a Firebase project */
  clientId: '603386649315-vp4revvrcgrcjme51ebuhbkbspl048l9.apps.googleusercontent.com',
};

/*
 * StorageKey is used for caching the OAuth Key in your app so you can use it later.
 * This can be any string value, but usually it follows this format: @AppName:NameOfValue
 */
const StorageKey = '@PillarValley:GoogleOAuthKey';

/*
 * Notice that Sign-In / Sign-Out aren't operations provided by this module.
 * We emulate them by using authAsync / revokeAsync.
 * For instance if you wanted an "isAuthenticated" flag, you would observe your local tokens.
 * If the tokens exist then you are "Signed-In".
 * Likewise if you cannot refresh the tokens, or they don't exist, then you are "Signed-Out"
 */
async function signInAsync() {
  const authState = await AppAuth.authAsync(config);
  await cacheAuthAsync(authState);
  console.log('signInAsync', authState);
  return authState;
}

/* Let's save our user tokens so when the app resets we can try and get them later */
function cacheAuthAsync(authState) {
  return AsyncStorage.setItem(StorageKey, JSON.stringify(authState));
}

/* Before we start our app, we should check to see if a user is signed-in or not */
async function getCachedAuthAsync() {
  /* First we will try and get the cached auth */
  const value = await AsyncStorage.getItem(StorageKey);
  /* Async Storage stores data as strings, we should parse our data back into a JSON */
  const authState = JSON.parse(value);
  console.log('getCachedAuthAsync', authState);
  if (authState) {
    /* If our data exists, than we should see if it's expired */
    if (checkIfTokenExpired(authState)) {
      /*
       * The session has expired.
       * Let's try and refresh it using the refresh token that some
       * OAuth providers will return when we sign-in initially.
       */
      return refreshAuthAsync(authState);
    } else {
      return authState;
    }
  }
  return null;
}

/*
 * You might be familiar with the term "Session Expired", this method will check if our session has expired.
 * An expired session means that we should reauthenticate our user.
 * You can learn more about why on the internet: https://www.quora.com/Why-do-web-sessions-expire
 * > Fun Fact: Charlie Cheever the creator of Expo also made Quora :D
 */
function checkIfTokenExpired({ accessTokenExpirationDate }) {
  return new Date(accessTokenExpirationDate) < new Date();
}

/*
 * Some OAuth providers will return a "Refresh Token" when you sign-in initially.
 * When our session expires, we can exchange the refresh token to get new auth tokens.
 * > Auth tokens are not the same as a Refresh token
 *
 * Not every provider (very few actually) will return a new "Refresh Token".
 * This just means the user will have to Sign-In more often.
 */
async function refreshAuthAsync({ refreshToken }) {
  const authState = await AppAuth.refreshAsync(config, refreshToken);
  console.log('refreshAuthAsync', authState);
  await cacheAuthAsync(authState);
  return authState;
}

/*
 * To sign-out we want to revoke our tokens.
 * This is what high-level auth solutions like FBSDK are doing behind the scenes.
 */
async function signOutAsync({ accessToken }) {
  try {
    await AppAuth.revokeAsync(config, {
      token: accessToken,
      isClientIdProvided: true,
    });
    /*
     * We are removing the cached tokens so we can check on our auth state later.
     * No tokens = Not Signed-In :)
     */
    await AsyncStorage.removeItem(StorageKey);
    return null;
  } catch ({ message }) {
    alert(`Failed to revoke token: ${message}`);
  }
}
```
