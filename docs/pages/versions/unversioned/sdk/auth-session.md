---
title: AuthSession
sourceCodeUrl: 'https://github.com/expo/expo/blob/sdk-36/packages/expo/src/AuthSession.ts'
---

import PlatformsSection from '~/components/plugins/PlatformsSection';
import InstallSection from '~/components/plugins/InstallSection';
import TableOfContentSection from '~/components/plugins/TableOfContentSection';

`AuthSession` is the easiest way to add web browser based authentication (for example, browser-based OAuth flows) to your app, built on top of [WebBrowser](../webbrowser/), [Crypto](../crypto/), and [Random](../random/). If you would like to understand how it does this, read this document from top to bottom. If you just want to use it, jump to the [Example](#example).

<PlatformsSection android emulator ios simulator web />

<TableOfContentSection title='Table of contents' contents={['Installation', 'Example', 'Hooks', 'Methods', 'Classes', 'Types', 'Redirect URI patterns', 'Guides to integrate with popular providers', 'Advanced usage']} />

<br />

## Installation

<InstallSection packageName="expo-auth-session" />

In **bare-workflow** you can use the [`uri-scheme` package](https://www.npmjs.com/package/uri-scheme) to easily add, remove, list, and open your URIs.

To make your native app handle `mycoolredirect://` simply run:

```sh
npx uri-scheme add mycoolredirect
```

You should now be able to see a list of all your project's schemes by running:

```sh
npx uri-scheme list
```

You can test it to ensure it works like this:

```sh
# Rebuild the native apps, be sure to use an emulator
yarn ios
yarn android

# Open a URI scheme
npx uri-scheme open mycoolredirect://some/redirect
```

## How web browser based authentication flows work

The typical flow for browser-based authentication in mobile apps is as follows:

- **Initiation**: the user presses a sign in button
- **Open web browser**: the app opens up a web browser to the authentication provider sign in page. The url that is opened for the sign in page usually includes information to identify the app, and a URL to redirect to on success. _Note: the web browser should share cookies with your system web browser so that users do not need to sign in again if they are already authenticated on the system browser -- Expo's [WebBrowser](../webbrowser/) API takes care of this._
- **Authentication provider redirects**: upon successful authentication, the authentication provider should redirect back to the application by redirecting to URL provided by the app in the query parameters on the sign in page ([read more about how linking works in mobile apps](../../workflow/linking/)), _provided that the URL is in the whitelist of allowed redirect URLs_. Whitelisting redirect URLs is important to prevent malicious actors from pretending to be your application. The redirect includes data in the URL (such as user id and token), either in the location hash, query parameters, or both.
- **App handles redirect**: the redirect is handled by the app and data is parsed from the redirect URL.

## What `auth.expo.io` does for you

> The `auth.expo.io` proxy is only used when `startAsync` is called, or when `useProxy: true` is passed to the `promptAsync()` method of an `AuthRequest`.

### It reduces boilerplate

`AuthSession` handles most of the app-side responsibilities for you:

- It opens the sign in URL for your authentication provider (`authUrl`, you must provide it) in a web browser that shares cookies with your system browser.
- It handles success redirects and extracts all of the data encoded in the URL.
- It handles failures and provides information to you about what went wrong.

### It makes redirect URL whitelists easier to manage for development and working in teams

Additionally, `AuthSession` **simplifies setting up authorized redirect URLs** by using an Expo service that sits between you and your authentication provider ([read Security considerations for caveats](#security-considerations)). This is particularly valuable with Expo because your app can live at various URLs. In development, you can have a tunnel URL, a lan URL, and a localhost URL. The tunnel URL on your machine for the same app will be different from a co-worker's machine. When you publish your app, that will be another URL that you need to whitelist. If you have multiple environments that you publish to, each of those will also need to be whitelisted. `AuthSession` gets around this by only having you whitelist one URL with your authentication provider: `https://auth.expo.io/@your-username/your-app-slug`. When authentication is successful, your authentication provider will redirect to that Expo Auth URL, and then the Expo Auth service will redirect back to your appplication. If the URL that the auth service is redirecting back to does not match the published URL for the app or the standalone app scheme (eg: `exp://expo.io/@your-username/your-app-slug`, or `yourscheme://`), then it will show a warning page before asking the user to sign in. This means that in development you will see this warning page when you sign in, a small price to pay for the convenience.

How does this work? When you open an authentication session with `AuthSession`, it first visits `https://auth.expo.io/@your-username/your-app-slug/start` and passes in the `authUrl` and `returnUrl` (the URL to redirect back to your application) in the query parameters. The Expo Auth service saves away the `returnUrl` (and if it is not a published URL or your registered custom theme, shows a warning page) and then sends the user off to the `authUrl`. When the authentication provider redirects back to `https://auth.expo.io/@your-username/your-app-slug` on success, the Expo Auth services redirects back to the `returnUrl` that was provided on initiating the authentication flow.

## Security considerations

If you are authenticating with a popular social provider, when you are ready to ship to production you should be sure that you do not directly request the access token for the user. Instead, most providers give an option to request a one-time code that can be combined with a secret key to request an access token. For an example of this flow, [see the _Confirming Identity_ section in the Facebook Login documentation](https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow/#confirm).

**Never put any secret keys inside of your app, there is no secure way to do this!** Instead, you should store your secret key(s) on a server and expose an endpoint that makes API calls for your client and passes the data back.

### Usage in standalone apps

In order to be able to deep link back into your app, you will need to set a `scheme` in your project `app.json`, and then build your standalone app (it can't be updated with an OTA update). If you do not include a scheme, the authentication flow will complete but it will be unable to pass the information back into your application and the user will have to manually exit the authentication modal.

## Example

```tsx
import React from 'react';
import { Button, StyleSheet, Platform, Text, View } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'expo';

/* @info <strong>Web only:</strong> This method should be invoked on the page that the auth popup gets redirected to on web, it'll ensure that authentication is completed properly. On native this does nothing. */
if (Platform.OS === 'web') {
  WebBrowser.maybeCompleteAuthSession();
}
/* @end */

/* @info Using the Expo proxy will redirect the user through auth.expo.io enabling you to use web links when configuring your project with an OAuth provider. This is not available on web. */
const useProxy = true;
/* @end */

const redirectUri = Platform.select({
  web: AuthSession.getRedirectUrl(),
  default: useProxy ? AuthSession.getRedirectUrl() : Linking.makeUrl(),
});

export default function App() {
  /* @info If the provider supports auto discovery then you can pass an issuer to the `useAutoDiscovery` hook to fetch the discovery document. */
  const discovery = AuthSession.useAutoDiscovery('https://demo.identityserver.io');
  /* @end */

  // Create and load an auth request:
  const [request, result, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: 'native.code',
      /* @info After a user finishes authenticating, the server will redirect them to this URI. Learn more about <a href="../../workflow/linking/">linking here</a>. */
      redirectUri,
      /* @end */
      scopes: ['openid', 'profile', 'email', 'offline_access'],
    },
    discovery
  );

  return (
    <View style={styles.container}>
      <Button
        disabled={!request}
        title="Auth with Identity"
        onPress={() => promptAsync({ useProxy })}
      />
      /* @info In this example, show the authentication result after success. In a real application,
      this would be a weird thing to do, instead you would use this data to match the user with a user
      in your application and sign them in. */
      {result && <Text>{JSON.stringify(result, null, 2)}</Text>}
      /* @end */
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

## API

```js
import * as AuthSession from 'expo-auth-session';
```

## Hooks

### `useAuthRequest`

```ts
const [request, response, promptAsync] = useAuthRequest({ ... }, { ... });
```

Load an authorization request for a code. Returns a loaded request, a response, and a prompt method.
When the prompt method completes then the response will be fulfilled.

#### Arguments

- **config (_AuthRequestConfig_)** -- A valid `AuthRequestConfig` that specifies what provider to use.
- **discovery (_DiscoveryDocument_)** -- A loaded `DiscoveryDocument` with endpoints used for authenticating. Only `authorizationEndpoint` is required for requesting an authorization code.

#### Returns

- **request (_AuthRequest | null_)** -- An instance of `AuthRequest` that can be used to prompt the user for authorization. This will be `null` until the auth request has finished loading.
- **response (_AuthResponse | null_)** -- This is `null` until `promptAsync` has been invoked. Once fulfilled it will return information about the authorization.
- **promptAsync (_function_)** -- When invoked, a web browser will open up and prompt the user for authentication. Accepts an `AuthRequestPromptOptions` object with options about how the prompt will execute. You can use this to enable the Expo proxy service `auth.expo.io`.

### `useAutoDiscovery`

```ts
const discovery = useAutoDiscovery('https://example.com/auth');
```

Given an OpenID Connect issuer URL, this will fetch and return the `DiscoveryDocument` (a collection of URLs) from the resource provider.

#### Arguments

- **issuer (_string_)** -- URL using the `https` scheme with no query or fragment component that the OP asserts as its Issuer Identifier.

#### Returns

- **discovery (_DiscoveryDocument | null_)** -- Returns `null` until the `DiscoveryDocument` has been fetched from the provided issuer URL.

## Methods

### `AuthSession.loadAsync()`

Load an authorization request for a code.

#### Arguments

- **config (_AuthRequestConfig_)** -- A valid `AuthRequestConfig` that specifies what provider to use.
- **discovery (_IssuerOrDiscovery_)** -- A loaded `DiscoveryDocument` or `Issuer` URL. Only `authorizationEndpoint` is required for requesting an authorization code.

#### Returns

- **request (_AuthRequest_)** -- An instance of `AuthRequest` that can be used to prompt the user for authorization.

### `AuthSession.fetchDiscoveryAsync()`

Fetch a `DiscoveryDocument` from a well-known resource provider that supports auto discovery.

#### Arguments

- **issuer (_Issuer_)** -- An `Issuer` URL to fetch from.

#### Returns

- **discovery (_DiscoveryDocument_)** -- A discovery document that can be used for authentication.

### `AuthSession.startAsync(options)`

Initiate an authentication session with the given options. Only one `AuthSession` can be active at any given time in your application; if you attempt to open a second session while one is still in progress, the second session will return a value to indicate that `AuthSession` is locked.

#### Arguments

- **options (_object_)** --

  A map of options:

  - **authUrl (_string_)** -- **Required**. The URL that points to the sign in page that you would like to open the user to.

  - **returnUrl (_string_)** -- The URL to return to the application. In managed apps, it's optional (defaults to `${Constants.linkingUrl}expo-auth-session`, for example, `exp://expo.io/@yourname/your-app-slug+expo-auth-session`). However, in the bare app, it's required - `AuthSession` needs to know where to wait for the response. Hence, this method will throw an exception, if you don't provide `returnUrl`.

  - **showInRecents (_optional_) (_boolean_)** -- (_Android only_) a boolean determining whether browsed website should be shown as separate entry in Android recents/multitasking view. Default: `false`

#### Returns

Returns a Promise that resolves to a result object of the following form:

- If the user cancelled the authentication session by closing the browser, the result is `{ type: 'cancel' }`.
- If the authentication is dismissed manually with `AuthSession.dismiss()`, the result is `{ type: 'dismiss' }`.
- If the authentication flow is successful, the result is `{type: 'success', params: Object, event: Object }`
- If the authentication flow is returns an error, the result is `{type: 'error', params: Object, errorCode: string, event: Object }`
- If you call `AuthSession.startAsync` more than once before the first call has returned, the result is `{type: 'locked'}`, because only one `AuthSession` can be in progress at any time.

### `AuthSession.dismiss()`

Cancels an active `AuthSession` if there is one. No return value, but if there is an active `AuthSession` then the Promise returned by the `AuthSession.startAsync` that initiated it resolves to `{ type: 'dismiss' }`.

### `AuthSession.getRedirectUrl()`

```ts
AuthSession.getRedirectUrl(extraPath?: string): string
```

Get the URL that your authentication provider needs to redirect to. For example: `https://auth.expo.io/@your-username/your-app-slug`. You can pass an additional path component to be appended to the default redirect URL.

> **Note** This method will throw an exception if you're using the bare workflow on native.

```js
const url = AuthSession.getRedirectUrl('redirect');

// Managed: https://auth.expo.io/@your-username/your-app-slug/redirect
// Web: https://localhost:19006/redirect
```

## Classes

### `AuthRequest`

Used to manage an authorization request according to the OAuth spec: [Section 4.1.1][s411].
You can use this class directly for more info around the authorization.

**Common use-cases**

- Parse a URL returned from the authorization server with `parseReturnUrlAsync()`.
- Get the built authorization URL with `buildUrlAsync()`.
- Get a loaded JSON representation of the auth request with crypto state loaded with `getAuthRequestConfigAsync()`.

```ts
// Create a request.
const request = new AuthRequest({ ... });

// Prompt for an auth code
const result = await request.promptAsync(discovery, { useProxy: true });

// Get the URL to invoke
const url = await request.buildUrlAsync(discovery);

// Get the URL to invoke
const parsed = await request.parseReturnUrlAsync("<URL From Server>");
```

### `AuthError`

Represents an authorization response error: [Section 5.2][s52].
Often times providers will fail to return the proper error message for a given error code.
This error method will add the missing description for more context on what went wrong.

## Types

### `ResponseType`

The client informs the authorization server of the
desired grant type by using the a response type: [Section 3.1.1][s311].

| Name  | Description                                     | Spec                   |
| ----- | ----------------------------------------------- | ---------------------- |
| Code  | For requesting an authorization code            | [Section 4.1.1][s411]. |
| Token | For requesting an access token (implicit grant) | [Section 4.2.1][s421]  |

### `AuthRequestConfig`

Represents an OAuth authorization request as JSON.

| Name                | Type                      | Description                                                    | Default | Spec                   |
| ------------------- | ------------------------- | -------------------------------------------------------------- | ------- | ---------------------- |
| responseType        | `ResponseType`            | Specifies what is returned from the authorization server       | `.Code` | [Section 3.1.1][s311]  |
| clientId            | `string`                  | Unique ID representing the info provided by the client         |         | [Section 2.2][s22]     |
| redirectUri         | `string`                  | The server will redirect to this URI when complete             |         | [Section 3.1.2][s312]  |
| scopes              | `string[]`                | List of strings to request access to                           |         | [Section 3.3][s33]     |
| clientSecret        | `?string`                 | Client secret supplied by an auth provider                     |         | [Section 2.3.1][s231]  |
| codeChallengeMethod | `CodeChallengeMethod`     | Method used to generate the code challenge                     | `.S256` | [Section 6.2][s62]     |
| codeChallenge       | `?string`                 | Derived from the code verifier using the `CodeChallengeMethod` |         | [Section 4.2][s42]     |
| state               | `?string`                 | Used for protection against Cross-Site Request Forgery         |         | [Section 10.12][s1012] |
| usePKCE             | `?boolean`                | Should use Proof Key for Code Exchange                         | `true`  | [PKCE][pkce]           |
| extraParams         | `?Record<string, string>` | Extra query params that'll be added to the query string        |         | `N/A`                  |

### `AuthRequestPromptOptions`

Options passed to the `promptAsync()` method of `AuthRequest`s.

| Name          | Type       | Description                                                                | Default         |
| ------------- | ---------- | -------------------------------------------------------------------------- | --------------- |
| useProxy      | `?boolean` | Should use `auth.expo.io` proxy for redirecting auth requests              | `false`         |
| showInRecents | `?boolean` | Should browsed website be shown as a separate entry in Android multitasker | `false`         |
| url           | `?string`  | URL that'll begin the auth request, usually this should be left undefined  | Preloaded value |

### `CodeChallengeMethod`

| Name  | Description                                                            |
| ----- | ---------------------------------------------------------------------- |
| S256  | The default and recommended method for transforming the code verifier. |
| Plain | When used, the code verifier will be sent to the server as-is.         |

### `DiscoveryDocument`

| Name                  | Type               | Description                                                                   | Spec                                    |
| --------------------- | ------------------ | ----------------------------------------------------------------------------- | --------------------------------------- |
| authorizationEndpoint | `string`           | Interact with the resource owner and obtain an authorization grant            | [Section 3.1][s31]                      |
| tokenEndpoint         | `string`           | Obtain an access token by presenting its authorization grant or refresh token | [Section 3.2][s32]                      |
| revocationEndpoint    | `?string`          | Used to revoke a token (generally for signing out)                            | [Section 2.1][s21]                      |
| userInfoEndpoint      | `?string`          | URL to return info about the authenticated user                               | [UserInfo][userinfo]                    |
| endSessionEndpoint    | `?string`          | URL to request that the End-User be logged out at the OP.                     | [OP Metadata][opmeta]                   |
| registrationEndpoint  | `?string`          | URL of the OP's "Dynamic Client Registration" endpoint                        | [Dynamic Client Registration][oidc-dcr] |
| discoveryDocument     | `ProviderMetadata` | All metadata about the provider                                               | [ProviderMetadata][provider-meta]       |

### `Issuer`

Type: `string`

URL using the `https` scheme with no query or fragment component that the OP asserts as its Issuer Identifier.

### `ProviderMetadata`

Metadata describing the [OpenID Provider][provider-meta].

## Redirect URI patterns

Here are a few examples of some common redirect URI patterns you may end up using.

#### Expo Proxy

> `https://auth.expo.io/@yourname/your-app`

- Used for a development or production project in the Expo client, or in a standalone build.
- The link is constructed from your Expo username and the Expo app name, which are appended to the proxy website.
- You can create this link with using `AuthSession.getRedirectUrl()` from `expo-auth-session`. This `redirectUri` should be used with `promptAsync({ useProxy: true })`.

#### Published project in the Expo Client

> `exp://exp.host/@yourname/your-app`

- Used for a production project in the Expo client.
- The link is constructed from your Expo username and the Expo app name, which are appended to the Expo client URI scheme.
- This is used when you run `expo publish` and open your app in the Expo client.
- You can create this link with using `Linking.makeUrl()` from `expo`.

#### Development project in the Expo client

> `exp://localhost:19000`

- This is for native projects in the Expo client when you run `expo start`.
- You can create this link with using `Linking.makeUrl()` from `expo`.
- This URL is constructed by your Expo servers `port` + `host`.
  - The `localhost` can be swapped out for your IP address.

#### Standalone, Bare, or Custom

> `yourscheme:/*`

- In standalone builds, ejecting to bare, or custom client, this is created from the `expo.scheme` property of your `app.json` config.
  - This value must be built into the native app, meaning you cannot use it with the App store or Play store Expo client.
- If you change the `expo.scheme` after ejecting then you'll need to use the `expo apply` command to apply the changes to your native project, then rebuild them.

## Guides to integrate with popular providers

- [Google](#google)
- [Okta](#okta)
- [Azure v2](#azure-v2)
- [Identity 4](#identity-4)
- [Facebook](#facebook)
- [Uber](#uber)
- [FitBit](#fitbit)
- [Reddit](#reddit)
- [Coinbase](#coinbase)
- [GitHub](#github)
- [Slack](#slack)
- [Spotify](#spotify)

### Google

| Website                     | Provider | PKCE      | Auto Discovery | Client Secret |
| --------------------------- | -------- | --------- | -------------- | ------------- |
| [Get Your Config][c-google] | OpenID   | Supported | Available      | No            |

[c-google]: https://developers.google.com/identity/protocols/OAuth2

- Google will provide you with a custom `redirectUri` which you cannot use in the Expo client.
  - URI schemes must be built into the app, you can do this with **bare, standalone, and custom clients**.
  - You can still use **cannot use in the Expo client** without the proxy service, just be sure to configure the project as a website.

```ts
// Endpoint
const discovery = useAutoDiscovery('https://accounts.google.com');
// Request
const [request, response, promptAsync] = useAuthRequest(
  {
    clientId: 'CLIENT_ID',
    // For usage in bare and standalone
    redirectUri: 'com.googleusercontent.apps.GOOGLE_GUID://redirect',
    // For usage in managed apps using the proxy
    redirectUri: AuthSession.getRedirectUrl(),
    scopes: ['openid', 'profile'],
    // Optional
    extraParams: {
      // Change language
      hl: 'fr',
      // Select the user
      login_hint: 'user@gmail.com',
      // select a prompt type
      prompt: 'select_account',
    },
    scopes: ['openid', 'profile'],
  },
  discovery
);
```

<!-- End Google -->

### Okta

| Website                          | Provider | PKCE      | Auto Discovery | Client Secret |
| -------------------------------- | -------- | --------- | -------------- | ------------- |
| [Sign-up][c-okta] > Applications | OpenID   | Supported | Available      | No            |

[c-okta]: https://developer.okta.com/signup/

- You cannot define a custom `redirectUri`, Okta will provide you with one.
- You can use the Expo proxy to test this without a native rebuild, just be sure to configure the project as a website.

```ts
// Endpoint
const discovery = useAutoDiscovery('https://<OKTA_DOMAIN>.com/oauth2/default');
// Request
const [request, response, promptAsync] = useAuthRequest(
  {
    clientId: 'CLIENT_ID',
    // For usage in bare and standalone
    redirectUri: 'com.okta.<OKTA_DOMAIN>:/callback',
    // For usage in managed apps using the proxy
    redirectUri: AuthSession.getRedirectUrl(),
    scopes: ['openid', 'profile'],
  },
  discovery
);
```

<!-- End Okta -->

### Azure v2

| Website                     | Provider | PKCE      | Auto Discovery | Client Secret |
| --------------------------- | -------- | --------- | -------------- | ------------- |
| [Get Your Config][c-azure2] | OpenID   | Supported | Available      | No            |

[c-azure2]: https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-overview

```ts
// Endpoint
const discovery = useAutoDiscovery('https://login.microsoftonline.com/<TENANT_ID>/v2.0');
// Request
const [request, response, promptAsync] = useAuthRequest(
  {
    clientId: 'CLIENT_ID',
    redirectUri: 'your.app://redirect',
    scopes: ['openid', 'profile', 'email', 'offline_access'],
  },
  discovery
);
```

<!-- End Azure v2 -->

### Identity 4

| Website                  | Provider | PKCE     | Auto Discovery | Client Secret |
| ------------------------ | -------- | -------- | -------------- | ------------- |
| [More Info][c-identity4] | OpenID   | Required | Available      | No            |

[c-identity4]: https://demo.identityserver.io/

- If `offline_access` isn't included then no refresh token will be returned.

```ts
// Endpoint
const discovery = useAutoDiscovery('https://demo.identityserver.io');
// Request
const [request, response, promptAsync] = useAuthRequest(
  {
    clientId: 'native.code',
    redirectUrl: 'myapp://redirect',
    scopes: ['openid', 'profile', 'offline_access'],
  },
  discovery
);
```

<!-- End Identity 4 -->

### Facebook

| Website                 | Provider | PKCE      | Auto Discovery | Client Secret |
| ----------------------- | -------- | --------- | -------------- | ------------- |
| [More Info][c-facebook] | OAuth    | Supported | Not Available  | Yes           |

[c-facebook]: https://developers.facebook.com/

- Learn more about [manually building a login flow](https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow/).
- If `offline_access` isn't included then no refresh token will be returned.

```ts
// Endpoint
const discovery = {
  authorizationEndpoint: 'https://www.facebook.com/v6.0/dialog/oauth',
  tokenEndpoint: 'https://graph.facebook.com/v6.0/oauth/access_token',
};
// Request
const [request, response, promptAsync] = useAuthRequest(
  {
    responseType: ResponseType.Token,
    clientId: '<YOUR FBID>',
    redirectUrl: AuthSession.getRedirectUrl(),
    scopes: ['public_profile', 'user_likes'],
  },
  discovery
);
```

<!-- Facebook -->

### Uber

| Website                   | Provider  | PKCE      | Auto Discovery | Client Secret |
| ------------------------- | --------- | --------- | -------------- | ------------- |
| [Get Your Config][c-uber] | OAuth 2.0 | Supported | Not Available  | Code Exchange |

[c-uber]: https://developer.uber.com/docs/riders/guides/authentication/introduction

- The `redirectUri` requires 2 slashes (`://`).
- `scopes` can be difficult to get approved.

```ts
// Endpoint
const discovery = {
  authorizationEndpoint: 'https://login.uber.com/oauth/v2/authorize',
  tokenEndpoint: 'https://login.uber.com/oauth/v2/token',
  revocationEndpoint: 'https://login.uber.com/oauth/v2/revoke',
};
// Request
const [request, response, promptAsync] = useAuthRequest(
  {
    clientId: 'CLIENT_ID',
    redirectUri: 'your.app://redirect',
    scopes: ['profile', 'delivery'],
  },
  discovery
);
```

<!-- End Uber -->

### FitBit

| Website                     | Provider  | PKCE      | Auto Discovery | Client Secret |
| --------------------------- | --------- | --------- | -------------- | ------------- |
| [Get Your Config][c-fitbit] | OAuth 2.0 | Supported | Not Available  | Code Exchange |

[c-fitbit]: https://dev.fitbit.com/apps/new

- Provider only allows one redirect URI per app. You'll need an individual app for every method you want to use:
  - Expo Client: `exp://localhost:19000/--/*`
  - Expo Client + Proxy: `https://auth.expo.io/@you/your-app`
  - Standalone or Bare: `com.your.app://*`
  - Web: `https://yourwebsite.com/*`
- The `redirectUri` requires 2 slashes (`://`).

```ts
// Endpoint
const discovery = {
  authorizationEndpoint: 'https://www.fitbit.com/oauth2/authorize',
  tokenEndpoint: 'https://api.fitbit.com/oauth2/token',
  revocationEndpoint: 'https://api.fitbit.com/oauth2/revoke',
};
// Request
const [request, response, promptAsync] = useAuthRequest(
  {
    clientId: 'CLIENT_ID',
    redirectUri: 'your.app://redirect',
    scopes: ['activity', 'sleep'],
  },
  discovery
);
```

<!-- End FitBit -->

### Reddit

| Website                     | Provider  | PKCE      | Auto Discovery | Client Secret |
| --------------------------- | --------- | --------- | -------------- | ------------- |
| [Get Your Config][c-reddit] | OAuth 2.0 | Supported | Not Available  | No            |

[c-reddit]: https://www.reddit.com/prefs/apps

- Provider only allows one redirect URI per app. You'll need an individual app for every method you want to use:
  - Expo Client: `exp://localhost:19000/--/*`
  - Expo Client + Proxy: `https://auth.expo.io/@you/your-app`
  - Standalone or Bare: `com.your.app://*`
  - Web: `https://yourwebsite.com/*`
- The `redirectUri` requires 2 slashes (`://`).

```ts
// Endpoint
const discovery = {
  authorizationEndpoint: 'https://www.reddit.com/api/v1/authorize.compact',
  tokenEndpoint: 'https://www.reddit.com/api/v1/access_token',
};
// Request
const [request, response, promptAsync] = useAuthRequest(
  {
    clientId: 'CLIENT_ID',
    redirectUri: 'your.app://redirect',
    scopes: ['identity'],
  },
  discovery
);
```

<!-- End Reddit -->

### Coinbase

| Website                       | Provider  | PKCE      | Auto Discovery | Client Secret |
| ----------------------------- | --------- | --------- | -------------- | ------------- |
| [Get Your Config][c-coinbase] | OAuth 2.0 | Supported | Not Available  | Code Exchange |

[c-coinbase]: https://www.coinbase.com/oauth/applications/new

- You cannot use the Expo proxy because they don't allow `@` in their redirect URIs.
- The `redirectUri` requires 2 slashes (`://`).
- Scopes must be joined with ':' so just create one long string.

```ts
// Endpoint
const discovery = {
  authorizationEndpoint: 'https://www.coinbase.com/oauth/authorize',
  tokenEndpoint: 'https://api.coinbase.com/oauth/token',
  revocationEndpoint: 'https://api.coinbase.com/oauth/revoke',
};
// Request
const [request, response, promptAsync] = useAuthRequest(
  {
    clientId: 'CLIENT_ID',
    redirectUri: 'your.app://redirect',
    scopes: ['wallet:accounts:read'],
  },
  discovery
);
```

<!-- End Coinbase -->

### GitHub

| Website                     | Provider  | PKCE      | Auto Discovery | Client Secret |
| --------------------------- | --------- | --------- | -------------- | ------------- |
| [Get Your Config][c-github] | OAuth 2.0 | Supported | Not Available  | Code Exchange |

[c-github]: https://github.com/settings/developers

- Provider only allows one redirect URI per app. You'll need an individual app for every method you want to use:
  - Expo Client: `exp://localhost:19000/--/*`
  - Expo Client + Proxy: `https://auth.expo.io/@you/your-app`
  - Standalone or Bare: `com.your.app://*`
  - Web: `https://yourwebsite.com/*`
- The `redirectUri` requires 2 slashes (`://`).
- `revocationEndpoint` is dynamic and requires your `config.clientId`.

```ts
// Endpoint
const discovery = {
  authorizationEndpoint: 'https://github.com/login/oauth/authorize',
  tokenEndpoint: 'https://github.com/login/oauth/access_token',
  revocationEndpoint: 'https://github.com/settings/connections/applications/<CLIENT_ID>',
};
// Request
const [request, response, promptAsync] = useAuthRequest(
  {
    clientId: 'CLIENT_ID',
    redirectUri: 'your.app://redirect',
    scopes: ['identity'],
  },
  discovery
);
```

<!-- End Github -->

### Slack

| Website                    | Provider  | PKCE      | Auto Discovery | Client Secret |
| -------------------------- | --------- | --------- | -------------- | ------------- |
| [Get Your Config][c-slack] | OAuth 2.0 | Supported | Not Available  | Code Exchange |

[c-slack]: https://api.slack.com/apps

- The `redirectUri` requires 2 slashes (`://`).
- `redirectUri` can be defined under the "OAuth & Permissions" section of the website.
- `clientId` and `clientSecret` can be found in the **"App Credentials"** section.
- Scopes must be joined with ':' so just create one long string.
- Navigate to the **"Scopes"** section to enable scopes.
- `revocationEndpoint` is not available.

```ts
// Endpoint
const discovery = {
  authorizationEndpoint: 'https://slack.com/oauth/authorize',
  tokenEndpoint: 'https://slack.com/api/oauth.access',
};
// Request
const [request, response, promptAsync] = useAuthRequest(
  {
    clientId: 'CLIENT_ID',
    redirectUri: 'your.app://redirect',
    scopes: ['emoji:read'],
  },
  discovery
);
```

<!-- End Slack -->

### Spotify

| Website                      | Provider  | PKCE      | Auto Discovery | Client Secret |
| ---------------------------- | --------- | --------- | -------------- | ------------- |
| [Get Your Config][c-spotify] | OAuth 2.0 | Supported | Not Available  | Code Exchange |

[c-spotify]: https://developer.spotify.com/dashboard/applications

```ts
// Endpoint
const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};
// Request
const [request, response, promptAsync] = useAuthRequest(
  {
    clientId: 'CLIENT_ID',
    redirectUri: 'your.app:/redirect',
    scopes: ['user-read-email', 'playlist-modify-public'],
  },
  discovery
);
```

<!-- End Spotify -->

<!-- End Examples -->

## Usage in the bare React Native app

In managed apps, `AuthSession` uses Expo servers to create a proxy between your application and the auth provider. Unfortunately, we don't provide support to use these servers in bare apps. To overcome this, you can create your proxy service.

### Proxy Service

This service is responsible for:

- redirecting traffic from your application to the authentication service
- redirecting response from the auth service to your application using a deep link

To better understand how it works, check out this implementation in `node.js`:

```js
const http = require('http');
const url = require('url');

const PORT = PORT;
const DEEP_LINK = DEEP_LINK_TO_YOUR_APPLICATION;

function redirect(response, url) {
  response.writeHead(302, {
    Location: url,
  });
  response.end();
}

http
  .createServer((request, response) => {
    // get parameters from request
    const parameters = url.parse(request.url, true).query;

    // if parameters contain authServiceUrl, this request comes from the application
    if (parameters.authServiceUrl) {
      // redirect user to the authUrl
      redirect(response, decodeURIComponent(parameters.authServiceUrl));
      return;
    }

    // redirect response from the auth service to your application
    redirect(response, DEEP_LINK);
  })
  .listen(PORT);
```

Client code which works with this service:

```js
const authServiceUrl = encodeURIComponent(YOUR_AUTH_URL); // we encode this, because it will be send as a query parameter
const authServiceUrlParameter = `authServiceUrl=${authUrl}`;
const authUrl = `YOUR_PROXY_SERVICE_URL?${authServiceUrlParameter}`;
const result = await AuthSession.startAsync({
  authUrl,
  returnUrl: YOUR_DEEP_LINK,
});
```

## Advanced usage

### Filtering out AuthSession events in Linking handlers

There are many reasons why you might want to handle inbound links into your app, such as push notifications or just regular deep linking (you can read more about this in the [Linking guide](../../workflow/linking/)); authentication redirects are only one type of deep link, and `AuthSession` handles these particular links for you. In your own `Linking.addEventListener` handlers, you can filter out deep links that are handled by `AuthSession` by checking if the URL includes the `+expo-auth-session` string -- if it does, you can ignore it. This works because `AuthSession` adds `+expo-auth-session` to the default `returnUrl`; however, if you provide your own `returnUrl`, you may want to consider adding a similar identifier to enable you to filter out `AuthSession` events from other handlers.

#

[userinfo]: https://openid.net/specs/openid-connect-core-1_0.html#UserInfo
[provider-meta]: https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata
[oidc-dcr]: https://openid.net/specs/openid-connect-discovery-1_0.html#OpenID.Registration
[opmeta]: https://openid.net/specs/openid-connect-session-1_0-17.html#OPMetadata
[s1012]: https://tools.ietf.org/html/rfc6749#section-10.12
[s62]: https://tools.ietf.org/html/rfc7636#section-6.2
[s52]: https://tools.ietf.org/html/rfc6749#section-5.2
[s421]: https://tools.ietf.org/html/rfc6749#section-4.2.1
[s42]: https://tools.ietf.org/html/rfc7636#section-4.2
[s411]: https://tools.ietf.org/html/rfc6749#section-4.1.1
[s311]: https://tools.ietf.org/html/rfc6749#section-3.1.1
[s311]: https://tools.ietf.org/html/rfc6749#section-3.1.1
[s312]: https://tools.ietf.org/html/rfc6749#section-3.1.2
[s33]: https://tools.ietf.org/html/rfc6749#section-3.3
[s32]: https://tools.ietf.org/html/rfc6749#section-3.2
[s231]: https://tools.ietf.org/html/rfc6749#section-2.3.1
[s22]: https://tools.ietf.org/html/rfc6749#section-2.2
[s21]: https://tools.ietf.org/html/rfc7009#section-2.1
[s31]: https://tools.ietf.org/html/rfc6749#section-3.1
[pkce]: https://oauth.net/2/pkce/
