---
title: AuthSession
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-45/packages/expo-auth-session'
packageName: 'expo-auth-session'
---

import APISection from '~/components/plugins/APISection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import {APIInstallSection} from '~/components/plugins/InstallSection';

import { SocialGrid, SocialGridItem, CreateAppButton } from '~/components/plugins/AuthSessionElements';
import { Terminal } from '~/ui/components/Snippet';
import SnackInline from '~/components/plugins/SnackInline';
import { InlineCode } from '~/components/base/code';

`AuthSession` is the easiest way to add web browser based authentication (for example, browser-based OAuth flows) to your app, built on top of [WebBrowser](webbrowser.md), [Crypto](crypto.md), and [Random](random.md). If you would like to understand how it does this, read this document from top to bottom. If you just want to use it, jump to the [Authentication Guide](/guides/authentication).

<PlatformsSection android emulator ios simulator web />

## Installation

> `expo-random` is a peer dependency and must be installed alongside `expo-auth-session`.

<APIInstallSection packageName="expo-auth-session expo-random" />

In **bare-workflow** you can use the [`uri-scheme` package][n-uri-scheme] to easily add, remove, list, and open your URIs.

[n-uri-scheme]: https://www.npmjs.com/package/uri-scheme

To make your native app handle `mycoolredirect://` simply run:

<Terminal cmd={['$ npx uri-scheme add mycoolredirect']} />

You should now be able to see a list of all your project's schemes by running:

<Terminal cmd={['$ npx uri-scheme list']} />

You can test it to ensure it works like this:

<Terminal cmd={[
'# Rebuild the native apps, be sure to use an emulated device',
'$ yarn ios',
'$ yarn android',
'',
'# Open a URI scheme',
'$ npx uri-scheme open mycoolredirect://some/redirect'
]} />

### Usage in standalone apps

**app.json**

```json
{
  "expo": {
    "scheme": "mycoolredirect"
  }
}
```

In order to be able to deep link back into your app, you will need to set a `scheme` in your project **app.config.js**, or **app.json**, and then build your standalone app (it can't be updated with an update). If you do not include a scheme, the authentication flow will complete but it will be unable to pass the information back into your application and the user will have to manually exit the authentication modal (resulting in a cancelled event).

## Guides

> The guides have moved: [Authentication Guide](/guides/authentication.md).

## How web browser based authentication flows work

The typical flow for browser-based authentication in mobile apps is as follows:

- **Initiation**: the user presses a sign in button
- **Open web browser**: the app opens up a web browser to the authentication provider sign in page. The url that is opened for the sign in page usually includes information to identify the app, and a URL to redirect to on success. _Note: the web browser should share cookies with your system web browser so that users do not need to sign in again if they are already authenticated on the system browser -- Expo's [WebBrowser](webbrowser.md) API takes care of this._
- **Authentication provider redirects**: upon successful authentication, the authentication provider should redirect back to the application by redirecting to URL provided by the app in the query parameters on the sign in page ([read more about how linking works in mobile apps](../../../guides/linking.md)), _provided that the URL is in the allowlist of allowed redirect URLs_. Allowlisting redirect URLs is important to prevent malicious actors from pretending to be your application. The redirect includes data in the URL (such as user id and token), either in the location hash, query parameters, or both.
- **App handles redirect**: the redirect is handled by the app and data is parsed from the redirect URL.

## What `auth.expo.io` does for you

> The `auth.expo.io` proxy is only used when `startAsync` is called, or when `useProxy: true` is passed to the `promptAsync()` method of an `AuthRequest`.

### It reduces boilerplate

`AuthSession` handles most of the app-side responsibilities for you:

- It opens the sign in URL for your authentication provider (`authUrl`, you must provide it) in a web browser that shares cookies with your system browser.
- It handles success redirects and extracts all of the data encoded in the URL.
- It handles failures and provides information to you about what went wrong.

### It makes redirect URL allowlists easier to manage for development and working in teams

Additionally, `AuthSession` **simplifies setting up authorized redirect URLs** by using an Expo service that sits between you and your authentication provider ([read Security considerations for caveats](#security-considerations)). This is particularly valuable with Expo because your app can live at various URLs. In development, you can have a tunnel URL, a lan URL, and a localhost URL. The tunnel URL on your machine for the same app will be different from a co-worker's machine. When you publish your app, that will be another URL that you need to allowlist. If you have multiple environments that you publish to, each of those will also need to be allowlisted. `AuthSession` gets around this by only having you allowlist one URL with your authentication provider: `https://auth.expo.io/@your-username/your-app-slug`. When authentication is successful, your authentication provider will redirect to that Expo Auth URL, and then the Expo Auth service will redirect back to your application. If the URL that the auth service is redirecting back to does not match the published URL for the app or the standalone app scheme (eg: `exp://expo.dev/@your-username/your-app-slug`, or `yourscheme://`), then it will show a warning page before asking the user to sign in. This means that in development you will see this warning page when you sign in, a small price to pay for the convenience.

How does this work? When you open an authentication session with `AuthSession`, it first visits `https://auth.expo.io/@your-username/your-app-slug/start` and passes in the `authUrl` and `returnUrl` (the URL to redirect back to your application) in the query parameters. The Expo Auth service saves away the `returnUrl` (and if it is not a published URL or your registered custom theme, shows a warning page) and then sends the user off to the `authUrl`. When the authentication provider redirects back to `https://auth.expo.io/@your-username/your-app-slug` on success, the Expo Auth services redirects back to the `returnUrl` that was provided on initiating the authentication flow.

## Security considerations

If you are authenticating with a popular social provider, when you are ready to ship to production you should be sure that you do not directly request the access token for the user. Instead, most providers give an option to request a one-time code that can be combined with a secret key to request an access token. For an example of this flow, [see the _Confirming Identity_ section in the Facebook Login documentation](https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow/#confirm).

**Never put any secret keys inside of your app, there is no secure way to do this!** Instead, you should store your secret key(s) on a server and expose an endpoint that makes API calls for your client and passes the data back.

# API

```js
import * as AuthSession from 'expo-auth-session';
```

<APISection packageName="expo-auth-session" apiName="AuthSession" />

## Providers

AuthSession has built-in support for some popular providers to make usage as easy as possible. These allow you to skip repetitive things like defining endpoints and abstract common features like `language`.

## Google

```tsx
import * as Google from 'expo-auth-session/providers/google';
```

- See the guide for more info on usage: [Google Authentication](/guides/authentication.md#google).
- Provides an extra `loginHint` parameter. If the user's email address is known ahead of time, it can be supplied to be the default option.
- Enforces minimum scopes to `['openid', 'https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email']` for optimal usage with services like Firebase and Auth0.
- By default, the authorization `code` will be automatically exchanged for an access token. This can be overridden with `shouldAutoExchangeCode`.
- Automatically uses the proxy in Expo Go because native auth is not supported due to custom build time configuration. This can be overridden with `redirectUriOptions.useProxy`.
- Defaults to using the bundle ID and package name for the native URI redirect instead of the reverse client ID.
- Disables PKCE for implicit and id-token based auth responses.
- On web, the popup is presented with the dimensions that are optimized for the Google login UI (`{ width: 515, height: 680 }`).

### `useAuthRequest()`

A hook used for opinionated Google authentication that works across platforms.

#### Arguments

- **config (`GoogleAuthRequestConfig`)** - A [`GoogleAuthRequestConfig`](#googleauthrequestconfig) object with client IDs for each platform that should be supported.
- **redirectUriOptions (`AuthSessionRedirectUriOptions`)** - Optional properties used to construct the redirect URI (passed to `makeRedirectUriAsync()`).

#### Returns

- **request (`GoogleAuthRequest | null`)** - An instance of [`GoogleAuthRequest`](#googleauthrequest) that can be used to prompt the user for authorization. This will be `null` until the auth request has finished loading.
- **response (`AuthSessionResult | null`)** - This is `null` until `promptAsync` has been invoked. Once fulfilled it will return information about the authorization.
- **promptAsync (`function`)** - When invoked, a web browser will open up and prompt the user for authentication. Accepts an [`AuthRequestPromptOptions`](#authrequestpromptoptions) object with options about how the prompt will execute. This **should not** be used to enable the Expo proxy service `auth.expo.io`, as the proxy will be automatically enabled based on the platform.

### `discovery`

A [`DiscoveryDocument`](#discoverydocument) object containing the discovery URLs used for Google auth.

## Facebook

```tsx
import * as Facebook from 'expo-auth-session/providers/facebook';
```

- Uses implicit auth (`ResponseType.Token`) by default.
- See the guide for more info on usage: [Facebook Authentication](/guides/authentication.md#facebook).
- Enforces minimum scopes to `['public_profile', 'email']` for optimal usage with services like Firebase and Auth0.
- Uses `display=popup` for better UI results.
- Automatically uses the proxy in Expo Go because native auth is not supported due to custom build time configuration.
- The URI redirect must be added to your **app.config.js** or **app.json** as `facebookScheme: 'fb<YOUR FBID>'`.
- Disables PKCE for implicit auth response.
- On web, the popup is presented with the dimensions `{ width: 700, height: 600 }`

### `useAuthRequest()`

A hook used for opinionated Facebook authentication that works across platforms.

#### Arguments

- **config (`FacebookAuthRequestConfig`)** - A [`FacebookAuthRequestConfig`](#facebookauthrequestconfig) object with client IDs for each platform that should be supported.
- **redirectUriOptions (`AuthSessionRedirectUriOptions`)** - Optional properties used to construct the redirect URI (passed to `makeRedirectUriAsync()`).

#### Returns

- **request (`FacebookAuthRequest | null`)** - An instance of [`FacebookAuthRequest`](#facebookauthrequest) that can be used to prompt the user for authorization. This will be `null` until the auth request has finished loading.
- **response (`AuthSessionResult | null`)** - This is `null` until `promptAsync` has been invoked. Once fulfilled it will return information about the authorization.
- **promptAsync (`function`)** - When invoked, a web browser will open up and prompt the user for authentication. Accepts an [`AuthRequestPromptOptions`](#authrequestpromptoptions) object with options about how the prompt will execute.

### `discovery`

A [`DiscoveryDocument`](#discoverydocument) object containing the discovery URLs used for Facebook auth.

## Usage in the bare React Native app

In managed apps, `AuthSession` uses Expo servers to create a proxy between your application and the auth provider. If you'd like, you can also create your own proxy service.

### Proxy Service

This service is responsible for:

- redirecting traffic from your application to the authentication service
- redirecting response from the auth service to your application using a deep link

To better understand how it works, check out this implementation in Node.js:

```js
const http = require('http');
const url = require('url');

const PORT = PORT;
const DEEP_LINK = DEEP_LINK_TO_YOUR_APPLICATION;

const redirect = (response, url) => {
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
const authServiceUrlParameter = `authServiceUrl=${authServiceUrl}`;
const authUrl = `YOUR_PROXY_SERVICE_URL?${authServiceUrlParameter}`;
const result = await AuthSession.startAsync({
  authUrl,
  returnUrl: YOUR_DEEP_LINK,
});
```

## Advanced usage

### Filtering out AuthSession events in Linking handlers

There are many reasons why you might want to handle inbound links into your app, such as push notifications or just regular deep linking (you can read more about this in the [Linking guide](../../../guides/linking.md)); authentication redirects are only one type of deep link, and `AuthSession` handles these particular links for you. In your own `Linking.addEventListener` handlers, you can filter out deep links that are handled by `AuthSession` by checking if the URL includes the `+expo-auth-session` string -- if it does, you can ignore it. This works because `AuthSession` adds `+expo-auth-session` to the default `returnUrl`; however, if you provide your own `returnUrl`, you may want to consider adding a similar identifier to enable you to filter out `AuthSession` events from other handlers.

#### With React Navigation v5

If you are using deep linking with React Navigation v5, filtering through `Linking.addEventListener` will not be sufficient, because deep linking is [handled differently](https://reactnavigation.org/docs/configuring-links/#advanced-cases). Instead, to filter these events you can add a custom `getStateFromPath` function to your linking configuration, and then filter by URL in the same way as described above.
