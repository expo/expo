---
title: Authentication
---

import PlatformsSection from '~/components/plugins/PlatformsSection';
import InstallSection from '~/components/plugins/InstallSection';
import TableOfContentSection from '~/components/plugins/TableOfContentSection';
import { SocialGrid, SocialGridItem, CreateAppButton, AuthMethodTabSwitcher, ImplicitTab, AuthMethodTab, AuthCodeTab } from '~/components/plugins/AuthSessionElements';
import TerminalBlock from '~/components/plugins/TerminalBlock';
import SnackInline from '~/components/plugins/SnackInline';

Expo can be used to login to many popular providers on iOS, Android, and web! Most of these guides utilize the pure JS [`AuthSession` API](/versions/latest/sdk/auth-session), refer to those docs for more information on the API.

Here are some **important rules** that apply to all authentication providers:

- Use `WebBrowser.maybeCompleteAuthSession()` to dismiss the web popup. If you forget to add this then the popup window will not close.
- Create redirects with `AuthSession.makeRedirectUri()` this does a lot of the heavy lifting involved with universal platform support. Behind the scenes it uses `expo-linking`.
- Build requests using `AuthSession.useAuthRequest()`, the hook allows for async setup which means mobile browsers won't block the authentication.
- Be sure to disable the prompt until `request` is defined.
- You can only invoke `promptAsync` in a user-interaction on web.

<TableOfContentSection title="Table of contents" contents={[
"Guides",
"Redirect URI patterns",
"Improving User Experience"
]} />

## Guides

**AuthSession** can be used for any OAuth or OpenID Connect provider, we've assembled guides for using the most requested services!
If you'd like to see more, you can [open a PR](https://github.com/expo/expo/edit/master/docs/pages/guides/authentication.md) or [vote on canny](https://expo.canny.io/feature-requests).

<SocialGrid>
  <SocialGridItem title="Identity 4" protocol={['OAuth 2', 'OpenID']} href="#identity-4" image="/static/images/sdk/auth-session/identity4.png" />
  <SocialGridItem title="Azure" protocol={['OAuth 2', 'OpenID']} href="#azure" image="/static/images/sdk/auth-session/azure.png" />
  <SocialGridItem title="Apple" protocol={['iOS Only']} href="/versions/latest/sdk/apple-authentication" image="/static/images/sdk/auth-session/apple.png" />
  <SocialGridItem title="Coinbase" protocol={['OAuth 2']} href="#coinbase" image="/static/images/sdk/auth-session/coinbase.png" />
  <SocialGridItem title="Dropbox" protocol={['OAuth 2']} href="#dropbox" image="/static/images/sdk/auth-session/dropbox.png" />
  <SocialGridItem title="Facebook" protocol={['OAuth 2']} href="#facebook" image="/static/images/sdk/auth-session/facebook.png" />
  <SocialGridItem title="Fitbit" protocol={['OAuth 2']} href="#fitbit" image="/static/images/sdk/auth-session/fitbit.png" />
  <SocialGridItem title="Firebase Phone" protocol={['Recaptcha']} href="/versions/latest/sdk/firebase-recaptcha" image="/static/images/sdk/auth-session/firebase-phone.png" />
  <SocialGridItem title="Github" protocol={['OAuth 2']} href="#github" image="/static/images/sdk/auth-session/github.png" />
  <SocialGridItem title="Google" protocol={['OAuth 2', 'OpenID']} href="#google" image="/static/images/sdk/auth-session/google.png" />
  <SocialGridItem title="Okta" protocol={['OAuth 2', 'OpenID']} href="#okta" image="/static/images/sdk/auth-session/okta.png" />
  <SocialGridItem title="Reddit" protocol={['OAuth 2']} href="#reddit" image="/static/images/sdk/auth-session/reddit.png" />
  <SocialGridItem title="Slack" protocol={['OAuth 2']} href="#slack" image="/static/images/sdk/auth-session/slack.png" />
  <SocialGridItem title="Spotify" protocol={['OAuth 2']} href="#spotify" image="/static/images/sdk/auth-session/spotify.png" />
  <SocialGridItem title="Strava" protocol={['OAuth 2']} href="#strava" image="/static/images/sdk/auth-session/strava.png" />
  <SocialGridItem title="Twitch" protocol={['OAuth 2']} href="#twitch" image="/static/images/sdk/auth-session/twitch.png" />
  <SocialGridItem title="Uber" protocol={['OAuth 2']} href="#uber" image="/static/images/sdk/auth-session/uber.png" />
</SocialGrid>

<br />

### Identity 4

| Website                  | Provider | PKCE     | Auto Discovery |
| ------------------------ | -------- | -------- | -------------- |
| [More Info][c-identity4] | OpenID   | Required | Available      |

[c-identity4]: https://demo.identityserver.io/

- If `offline_access` isn't included then no refresh token will be returned.

<SnackInline label='Identity 4 Auth' dependencies={['expo-auth-session', 'expo-web-browser']}>

```tsx
import * as React from 'react';
import { Button, Text, View } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

/* @info <strong>Web only:</strong> This method should be invoked on the page that the auth popup gets redirected to on web, it'll ensure that authentication is completed properly. On native this does nothing. */
WebBrowser.maybeCompleteAuthSession();
/* @end */

/* @info Using the Expo proxy will redirect the user through auth.expo.io enabling you to use web links when configuring your project with an OAuth provider. This is not available on web. */
const useProxy = true;
/* @end */

const redirectUri = AuthSession.makeRedirectUri({
  /* @info You need to manually define the redirect URI, in Expo this should match the value of <code>scheme</code> in your app.config.js or app.json . */
  native: 'your.app://redirect',
  /* @end */
  useProxy,
});

export default function App() {
  /* @info If the provider supports auto discovery then you can pass an issuer to the `useAutoDiscovery` hook to fetch the discovery document. */
  const discovery = AuthSession.useAutoDiscovery('https://demo.identityserver.io');
  /* @end */

  // Create and load an auth request
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
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Login!" disabled={!request} onPress={() => promptAsync({ useProxy })} />
      {result && <Text>{JSON.stringify(result, null, 2)}</Text>}
    </View>
  );
}
```

</SnackInline>

<!-- End Identity 4 -->

### Azure

<CreateAppButton name="Azure" href="https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-overview" />

| Website                     | Provider | PKCE      | Auto Discovery |
| --------------------------- | -------- | --------- | -------------- |
| [Get Your Config][c-azure2] | OpenID   | Supported | Available      |

[c-azure2]: https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-overview

<SnackInline label='Azure Auth Code' dependencies={['expo-auth-session', 'expo-web-browser']}>

```tsx
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest, useAutoDiscovery } from 'expo-auth-session';
import { Button } from 'react-native';

/* @info <strong>Web only:</strong> This method should be invoked on the page that the auth popup gets redirected to on web, it'll ensure that authentication is completed properly. On native this does nothing. */
WebBrowser.maybeCompleteAuthSession();
/* @end */

export default function App() {
  // Endpoint
  const discovery = useAutoDiscovery('https://login.microsoftonline.com/<TENANT_ID>/v2.0');
  // Request
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: 'CLIENT_ID',
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      // For usage in managed apps using the proxy
      redirectUri: makeRedirectUri({
        // For usage in bare and standalone
        native: 'your.app://redirect',
      }),
    },
    discovery
  );

  return (
    <Button
      /* @info Disable the button until the request is loaded asynchronously. */
      disabled={!request}
      /* @end */
      title="Login"
      onPress={() => {
        /* @info Prompt the user to authenticate in a user interaction or web browsers will block it. */
        promptAsync();
        /* @end */
      }}
    />
  );
}
```

</SnackInline>

<!-- End Azure -->

### Coinbase

<CreateAppButton name="Coinbase" href="https://www.coinbase.com/oauth/applications/new" />

| Website                       | Provider  | PKCE      | Auto Discovery |
| ----------------------------- | --------- | --------- | -------------- |
| [Get Your Config][c-coinbase] | OAuth 2.0 | Supported | Not Available  |

[c-coinbase]: https://www.coinbase.com/oauth/applications/new

- You cannot use the Expo proxy because they don't allow `@` in their redirect URIs.
- The `redirectUri` requires 2 slashes (`://`).
- Scopes must be joined with ':' so just create one long string.

<AuthMethodTabSwitcher tabs={["Auth Code", "Implicit Flow"]}>

<AuthCodeTab>

<SnackInline label='Coinbase Auth Code' dependencies={['expo-auth-session', 'expo-web-browser']}>

```tsx
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { Button } from 'react-native';

/* @info <strong>Web only:</strong> This method should be invoked on the page that the auth popup gets redirected to on web, it'll ensure that authentication is completed properly. On native this does nothing. */
WebBrowser.maybeCompleteAuthSession();
/* @end */

// Endpoint
const discovery = {
  authorizationEndpoint: 'https://www.coinbase.com/oauth/authorize',
  tokenEndpoint: 'https://api.coinbase.com/oauth/token',
  revocationEndpoint: 'https://api.coinbase.com/oauth/revoke',
};

export default function App() {
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: 'CLIENT_ID',
      scopes: ['wallet:accounts:read'],
      // For usage in managed apps using the proxy
      redirectUri: makeRedirectUri({
        // For usage in bare and standalone
        native: 'your.app://redirect',
      }),
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      /* @info Exchange the code for an access token in a server. Alternatively you can use the <b>Implicit</b> auth method. */
      const { code } = response.params;
      /* @end */
    }
  }, [response]);

  return (
    <Button
      /* @info Disable the button until the request is loaded asynchronously. */
      disabled={!request}
      /* @end */
      title="Login"
      onPress={() => {
        /* @info Prompt the user to authenticate in a user interaction or web browsers will block it. */
        promptAsync();
        /* @end */
      }}
    />
  );
}
```

</SnackInline>

</AuthCodeTab>

<ImplicitTab>

- Coinbase does not support implicit grant.

</ImplicitTab>
</AuthMethodTabSwitcher>

<!-- End Coinbase -->

### Dropbox

<CreateAppButton name="Dropbox" href="https://www.dropbox.com/developers/apps/create" />

| Website                      | Provider  | PKCE          | Auto Discovery |
| ---------------------------- | --------- | ------------- | -------------- |
| [Get Your Config][c-dropbox] | OAuth 2.0 | Not Supported | Not Available  |

[c-dropbox]: https://www.dropbox.com/developers/apps/create

- Scopes must be an empty array.
- PKCE must be disabled (`usePKCE: false`) otherwise you'll get an error about `code_challenge` being included in the query string.
- Implicit auth is supported.
- When `responseType: ResponseType.Code` is used (default behavior) the `redirectUri` must be `https`. This means that code exchange auth cannot be done on native without `useProxy` enabled.

<AuthMethodTabSwitcher tabs={["Auth Code", "Implicit Flow"]}>

<AuthCodeTab>

Auth code responses (`ResponseType.Code`) will only work in native with `useProxy: true`.

<SnackInline label='Dropbox Auth Code' dependencies={['expo-auth-session', 'expo-web-browser']}>

```tsx
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { Button, Platform } from 'react-native';

/* @info <strong>Web only:</strong> This method should be invoked on the page that the auth popup gets redirected to on web, it'll ensure that authentication is completed properly. On native this does nothing. */
WebBrowser.maybeCompleteAuthSession();
/* @end */

// Endpoint
const discovery = {
  authorizationEndpoint: 'https://www.dropbox.com/oauth2/authorize',
  tokenEndpoint: 'https://www.dropbox.com/oauth2/token',
};

/* @info Implicit auth is universal, <code>.Code</code> will only work in native with <code>useProxy: true</code>. */
const useProxy = Platform.select({ web: false, default: true });
/* @end */

export default function App() {
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: 'CLIENT_ID',
      // There are no scopes so just pass an empty array
      scopes: [],
      // Dropbox doesn't support PKCE
      usePKCE: false,
      // For usage in managed apps using the proxy
      redirectUri: makeRedirectUri({
        // For usage in bare and standalone
        native: 'your.app://redirect',
        useProxy,
      }),
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      /* @info Exchange the code for an access token in a server. Alternatively you can use the <b>Implicit</b> auth method. */
      const { code } = response.params;
      /* @end */
    }
  }, [response]);

  return (
    <Button
      /* @info Disable the button until the request is loaded asynchronously. */
      disabled={!request}
      /* @end */
      title="Login"
      onPress={() => {
        /* @info Prompt the user to authenticate in a user interaction or web browsers will block it. */
        promptAsync({ useProxy });
        /* @end */
      }}
    />
  );
}
```

</SnackInline>

</AuthCodeTab>

<ImplicitTab>

<SnackInline label='Dropbox Implicit' dependencies={['expo-auth-session', 'expo-web-browser']}>

```tsx
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, ResponseType, useAuthRequest } from 'expo-auth-session';
import { Button } from 'react-native';

/* @info <strong>Web only:</strong> This method should be invoked on the page that the auth popup gets redirected to on web, it'll ensure that authentication is completed properly. On native this does nothing. */
WebBrowser.maybeCompleteAuthSession();
/* @end */

// Endpoint
const discovery = {
  authorizationEndpoint: 'https://www.dropbox.com/oauth2/authorize',
  tokenEndpoint: 'https://www.dropbox.com/oauth2/token',
};

export default function App() {
  const [request, response, promptAsync] = useAuthRequest(
    {
      /* @info Request that the server returns an <code>access_token</code>, not all providers support this. */
      responseType: ResponseType.Token,
      /* @end */
      clientId: 'CLIENT_ID',
      // There are no scopes so just pass an empty array
      scopes: [],
      // Dropbox doesn't support PKCE
      usePKCE: false,
      // For usage in managed apps using the proxy
      redirectUri: makeRedirectUri({
        // For usage in bare and standalone
        native: 'your.app://redirect',
      }),
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      /* @info Use this access token to interact with user data on the provider's server. */
      const { access_token } = response.params;
      /* @end */
    }
  }, [response]);

  return (
    <Button
      /* @info Disable the button until the request is loaded asynchronously. */
      disabled={!request}
      /* @end */
      title="Login"
      onPress={() => {
        /* @info Prompt the user to authenticate in a user interaction or web browsers will block it. */
        promptAsync();
        /* @end */
      }}
    />
  );
}
```

</SnackInline>

</ImplicitTab>

</AuthMethodTabSwitcher>

<!-- End Dropbox -->

### Facebook

<CreateAppButton name="Facebook" href="https://developers.facebook.com/" />

| Website                 | Provider | PKCE      | Auto Discovery |
| ----------------------- | -------- | --------- | -------------- |
| [More Info][c-facebook] | OAuth    | Supported | Not Available  |

[c-facebook]: https://developers.facebook.com/

> You can use the [`expo-facebook`](/versions/latest/sdk/facebook) to authenticate via the Facebook app, however this functionality is limited.

- Learn more about [manually building a login flow](https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow/).
- Native auth isn't available in the App/Play Store client because you need a custom URI scheme built into the bundle. The custom scheme provided by Facebook is `fb` followed by the **project ID** (ex: `fb145668956753819`):
  - **Standalone:**
    - Add `facebookScheme: 'fb<YOUR FBID>'` to your `app.config.js` or `app.json`
    - You'll need to make a new production build to bundle these values `expo build:ios` & `expo build:android`.
  - **Bare:**
    - Run `npx uri-scheme add fb<YOUR FBID>`
    - Rebuild with `yarn ios` & `yarn android`
- You can still test native auth in the client by using the Expo proxy `useProxy`
- The `native` redirect URI **must** be formatted like `fbYOUR_NUMERIC_ID://authorize`
  - If the protocol/suffix is not your FBID then you will get an error like: `No redirect URI in the params: No redirect present in URI`.
  - If the path is not `://authorize` then you will get an error like: `Can't Load URL: The domain of this URL isn't included in the app's domains. To be able to load this URL, add all domains and subdomains of your app to the App Domains field in your app settings.`

<AuthMethodTabSwitcher tabs={["Auth Code", "Implicit Flow", "Firebase"]}>

<AuthCodeTab>

<SnackInline label='Facebook Auth Code' dependencies={['expo-auth-session', 'expo-web-browser']}>

```tsx
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { Button, Platform } from 'react-native';

/* @info <strong>Web only:</strong> This method should be invoked on the page that the auth popup gets redirected to on web, it'll ensure that authentication is completed properly. On native this does nothing. */
WebBrowser.maybeCompleteAuthSession();
/* @end */

// Endpoint
const discovery = {
  authorizationEndpoint: 'https://www.facebook.com/v6.0/dialog/oauth',
  tokenEndpoint: 'https://graph.facebook.com/v6.0/oauth/access_token',
};

const useProxy = Platform.select({ web: false, default: true });

export default function App() {
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: '<YOUR FBID>',
      scopes: ['public_profile', 'email', 'user_likes'],
      // For usage in managed apps using the proxy
      redirectUri: makeRedirectUri({
        useProxy,
        // For usage in bare and standalone
        // Use your FBID here. The path MUST be `authorize`.
        native: 'fb111111111111://authorize',
      }),
      extraParams: {
        // Use `popup` on web for a better experience
        display: Platform.select({ web: 'popup' }),
        // Optionally you can use this to rerequest declined permissions
        auth_type: 'rerequest',
      },
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      /* @info Exchange the code for an access token in a server. Alternatively you can use the <b>Implicit</b> auth method. */
      const { code } = response.params;
      /* @end */
    }
  }, [response]);

  return (
    <Button
      /* @info Disable the button until the request is loaded asynchronously. */
      disabled={!request}
      /* @end */
      title="Login"
      onPress={() => {
        /* @info Prompt the user to authenticate in a user interaction or web browsers will block it. */
        promptAsync({
          /* @end */
          useProxy,
          windowFeatures: { width: 700, height: 600 },
        });
      }}
    />
  );
}
```

</SnackInline>

</AuthCodeTab>

<ImplicitTab>

<SnackInline label='Facebook Implicit' dependencies={['expo-auth-session', 'expo-web-browser']}>

```tsx
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, ResponseType, useAuthRequest } from 'expo-auth-session';
import { Button, Platform } from 'react-native';

/* @info <strong>Web only:</strong> This method should be invoked on the page that the auth popup gets redirected to on web, it'll ensure that authentication is completed properly. On native this does nothing. */
WebBrowser.maybeCompleteAuthSession();
/* @end */

// Endpoint
const discovery = {
  authorizationEndpoint: 'https://www.facebook.com/v6.0/dialog/oauth',
  tokenEndpoint: 'https://graph.facebook.com/v6.0/oauth/access_token',
};

const useProxy = Platform.select({ web: false, default: true });

export default function App() {
  const [request, response, promptAsync] = useAuthRequest(
    {
      /* @info Request that the server returns an <code>access_token</code>, not all providers support this. */
      responseType: ResponseType.Token,
      /* @end */
      clientId: '<YOUR FBID>',
      scopes: ['public_profile', 'email', 'user_likes'],
      // For usage in managed apps using the proxy
      redirectUri: makeRedirectUri({
        useProxy,
        // For usage in bare and standalone
        // Use your FBID here. The path MUST be `authorize`.
        native: 'fb111111111111://authorize',
      }),
      extraParams: {
        // Use `popup` on web for a better experience
        display: Platform.select({ web: 'popup' }),
        // Optionally you can use this to rerequest declined permissions
        auth_type: 'rerequest',
      },
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      /* @info Use this access token to interact with user data on the provider's server. */
      const { access_token } = response.params;
      /* @end */
    }
  }, [response]);

  return (
    <Button
      /* @info Disable the button until the request is loaded asynchronously. */
      disabled={!request}
      /* @end */
      title="Login"
      onPress={() => {
        /* @info Prompt the user to authenticate in a user interaction or web browsers will block it. */
        promptAsync({
          /* @end */
          useProxy,
          windowFeatures: { width: 700, height: 600 },
        });
      }}
    />
  );
}
```

</SnackInline>

</ImplicitTab>

<ImplicitTab>

- It's important that you request at least the `['public_profile', 'email']` scopes, otherwise Firebase won't display the user info correctly in the auth panel.
- Be sure to setup Facebook auth as described above, this is basically identical.
- 🔥 Create a new Firebase project
- Enable Facebook auth, save the project.

<SnackInline label='Facebook Firebase' dependencies={['expo-auth-session', 'expo-web-browser', 'firebase']}>

```tsx
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, ResponseType, useAuthRequest } from 'expo-auth-session';
import firebase from 'firebase';
import { Button, Platform } from 'react-native';

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp({
    /* Config */
  });
}

/* @info <strong>Web only:</strong> This method should be invoked on the page that the auth popup gets redirected to on web, it'll ensure that authentication is completed properly. On native this does nothing. */
WebBrowser.maybeCompleteAuthSession();
/* @end */

// Endpoint
const discovery = {
  authorizationEndpoint: 'https://www.facebook.com/v6.0/dialog/oauth',
  tokenEndpoint: 'https://graph.facebook.com/v6.0/oauth/access_token',
};

const useProxy = Platform.select({ web: false, default: true });

export default function App() {
  const [request, response, promptAsync] = useAuthRequest(
    {
      /* @info Request that the server returns an <code>access_token</code>, not all providers support this. */
      responseType: ResponseType.Token,
      /* @end */
      clientId: '<YOUR FBID>',
      scopes: ['public_profile', 'email', 'user_likes'],
      // For usage in managed apps using the proxy
      redirectUri: makeRedirectUri({
        useProxy,
        // For usage in bare and standalone
        // Use your FBID here. The path MUST be `authorize`.
        native: 'fb111111111111://authorize',
      }),
      extraParams: {
        // Use `popup` on web for a better experience
        display: Platform.select({ web: 'popup' }),
        // Optionally you can use this to rerequest declined permissions
        auth_type: 'rerequest',
      },
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      /* @info Use this access token to interact with user data on the provider's server. */
      const { access_token } = response.params;
      /* @end */

      /* @info Create a Facebook credential with the <code>access_token</code> */
      const credential = firebase.auth.FacebookAuthProvider.credential(access_token);
      /* @end */
      // Sign in with the credential from the Facebook user.
      firebase.auth().signInWithCredential(credential);
    }
  }, [response]);

  return (
    <Button
      /* @info Disable the button until the request is loaded asynchronously. */
      disabled={!request}
      /* @end */
      title="Login"
      onPress={() => {
        /* @info Prompt the user to authenticate in a user interaction or web browsers will block it. */
        promptAsync({
          /* @end */
          useProxy,
          windowFeatures: { width: 700, height: 600 },
        });
      }}
    />
  );
}
```

</SnackInline>

</ImplicitTab>

</AuthMethodTabSwitcher>

<!-- End Facebook -->

### FitBit

<CreateAppButton name="FitBit" href="https://dev.fitbit.com/apps/new" />

| Website                     | Provider  | PKCE      | Auto Discovery |
| --------------------------- | --------- | --------- | -------------- |
| [Get Your Config][c-fitbit] | OAuth 2.0 | Supported | Not Available  |

[c-fitbit]: https://dev.fitbit.com/apps/new

- Provider only allows one redirect URI per app. You'll need an individual app for every method you want to use:
  - Expo Client: `exp://localhost:19000/--/*`
  - Expo Client + Proxy: `https://auth.expo.io/@you/your-app`
  - Standalone or Bare: `com.your.app://*`
  - Web: `https://yourwebsite.com/*`
- The `redirectUri` requires 2 slashes (`://`).

<AuthMethodTabSwitcher tabs={["Auth Code", "Implicit Flow"]}>
<AuthCodeTab>

<SnackInline label='FitBit Auth Code' dependencies={['expo-auth-session', 'expo-web-browser']}>

```tsx
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { Button, Platform } from 'react-native';

/* @info <strong>Web only:</strong> This method should be invoked on the page that the auth popup gets redirected to on web, it'll ensure that authentication is completed properly. On native this does nothing. */
WebBrowser.maybeCompleteAuthSession();
/* @end */

// Endpoint
const discovery = {
  authorizationEndpoint: 'https://www.fitbit.com/oauth2/authorize',
  tokenEndpoint: 'https://api.fitbit.com/oauth2/token',
  revocationEndpoint: 'https://api.fitbit.com/oauth2/revoke',
};

export default function App() {
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: 'CLIENT_ID',
      scopes: ['activity', 'sleep'],
      // For usage in managed apps using the proxy
      redirectUri: makeRedirectUri({
        // For usage in bare and standalone
        native: 'your.app://redirect',
      }),
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      /* @info Exchange the code for an access token in a server. Alternatively you can use the <b>Implicit</b> auth method. */
      const { code } = response.params;
      /* @end */
    }
  }, [response]);

  return (
    <Button
      /* @info Disable the button until the request is loaded asynchronously. */
      disabled={!request}
      /* @end */
      title="Login"
      onPress={() => {
        /* @info Prompt the user to authenticate in a user interaction or web browsers will block it. */
        promptAsync();
        /* @end */
      }}
    />
  );
}
```

</SnackInline>

</AuthCodeTab>

<ImplicitTab>

<SnackInline label='FitBit Implicit' dependencies={['expo-auth-session', 'expo-web-browser']}>

```tsx
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, ResponseType, useAuthRequest } from 'expo-auth-session';
import { Button, Platform } from 'react-native';

/* @info <strong>Web only:</strong> This method should be invoked on the page that the auth popup gets redirected to on web, it'll ensure that authentication is completed properly. On native this does nothing. */
WebBrowser.maybeCompleteAuthSession();
/* @end */

const useProxy = Platform.select({ web: false, default: true });

// Endpoint
const discovery = {
  authorizationEndpoint: 'https://www.fitbit.com/oauth2/authorize',
  tokenEndpoint: 'https://api.fitbit.com/oauth2/token',
  revocationEndpoint: 'https://api.fitbit.com/oauth2/revoke',
};

export default function App() {
  const [request, response, promptAsync] = useAuthRequest(
    {
      /* @info Request that the server returns an <code>access_token</code>, not all providers support this. */
      responseType: ResponseType.Token,
      /* @end */
      clientId: 'CLIENT_ID',
      scopes: ['activity', 'sleep'],
      // For usage in managed apps using the proxy
      redirectUri: makeRedirectUri({
        useProxy,
        // For usage in bare and standalone
        native: 'your.app://redirect',
      }),
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      /* @info Use this access token to interact with user data on the provider's server. */
      const { access_token } = response.params;
      /* @end */
    }
  }, [response]);

  return (
    <Button
      /* @info Disable the button until the request is loaded asynchronously. */
      disabled={!request}
      /* @end */
      title="Login"
      onPress={() => {
        /* @info Prompt the user to authenticate in a user interaction or web browsers will block it. */
        promptAsync({ useProxy });
        /* @end */
      }}
    />
  );
}
```

</SnackInline>

</ImplicitTab>

</AuthMethodTabSwitcher>

<!-- End FitBit -->

### GitHub

<CreateAppButton name="Github" href="https://github.com/settings/developers" />

| Website                     | Provider  | PKCE      | Auto Discovery |
| --------------------------- | --------- | --------- | -------------- |
| [Get Your Config][c-github] | OAuth 2.0 | Supported | Not Available  |

[c-github]: https://github.com/settings/developers

- Provider only allows one redirect URI per app. You'll need an individual app for every method you want to use:
  - Expo Client: `exp://localhost:19000/--/*`
  - Expo Client + Proxy: `https://auth.expo.io/@you/your-app`
  - Standalone or Bare: `com.your.app://*`
  - Web: `https://yourwebsite.com/*`
- The `redirectUri` requires 2 slashes (`://`).
- `revocationEndpoint` is dynamic and requires your `config.clientId`.

<AuthMethodTabSwitcher tabs={["Auth Code", "Implicit Flow"]}>
<AuthCodeTab>

<SnackInline label='GitHub Auth Code' dependencies={['expo-auth-session', 'expo-web-browser']}>

```tsx
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { Button } from 'react-native';

/* @info <strong>Web only:</strong> This method should be invoked on the page that the auth popup gets redirected to on web, it'll ensure that authentication is completed properly. On native this does nothing. */
WebBrowser.maybeCompleteAuthSession();
/* @end */

// Endpoint
const discovery = {
  authorizationEndpoint: 'https://github.com/login/oauth/authorize',
  tokenEndpoint: 'https://github.com/login/oauth/access_token',
  revocationEndpoint: 'https://github.com/settings/connections/applications/<CLIENT_ID>',
};

export default function App() {
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: 'CLIENT_ID',
      scopes: ['identity'],
      // For usage in managed apps using the proxy
      redirectUri: makeRedirectUri({
        // For usage in bare and standalone
        native: 'your.app://redirect',
      }),
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      /* @info Exchange the code for an access token in a server. Alternatively you can use the <b>Implicit</b> auth method. */
      const { code } = response.params;
      /* @end */
    }
  }, [response]);

  return (
    <Button
      /* @info Disable the button until the request is loaded asynchronously. */
      disabled={!request}
      /* @end */
      title="Login"
      onPress={() => {
        /* @info Prompt the user to authenticate in a user interaction or web browsers will block it. */
        promptAsync();
        /* @end */
      }}
    />
  );
}
```

</SnackInline>

</AuthCodeTab>

<ImplicitTab>

- Implicit grant is [not supported for Github](https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/).

</ImplicitTab>

</AuthMethodTabSwitcher>

<!-- End Github -->

### Google

<CreateAppButton name="Google" href="https://developers.google.com/identity/protocols/OAuth2" />

| Website                     | Provider | PKCE      | Auto Discovery |
| --------------------------- | -------- | --------- | -------------- |
| [Get Your Config][c-google] | OpenID   | Supported | Available      |

[c-google]: https://developers.google.com/identity/protocols/OAuth2

- Google will provide you with a custom `redirectUri` which you **cannot** use in the Expo client.
  - URI schemes must be built into the app, you can do this with **bare workflow, standalone, and custom clients**.
  - You can still develop and test Google auth in the Expo client with the proxy service, just be sure to configure the project as a website in the Google developer console.
- For a slightly more native experience in bare Android apps, you can use the [`expo-google-sign-in`](/versions/latest/sdk/google-sign-in) package.
- You can change the UI language by setting `extraParams.hl` to an ISO language code (ex: `fr`, `en-US`). Defaults to the best estimation based on the users browser.
- You can set which email address to use ahead of time by setting `extraParams.login_hint`.

<AuthMethodTabSwitcher tabs={["Auth Code", "Implicit Flow", "Firebase"]}>
<AuthCodeTab>

<SnackInline label='Google Auth Code' dependencies={['expo-auth-session', 'expo-web-browser']}>

```tsx
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest, useAutoDiscovery, Prompt } from 'expo-auth-session';
import { Button, Platform } from 'react-native';

/* @info <strong>Web only:</strong> This method should be invoked on the page that the auth popup gets redirected to on web, it'll ensure that authentication is completed properly. On native this does nothing. */
WebBrowser.maybeCompleteAuthSession();
/* @end */

const useProxy = Platform.select({ web: false, default: true });

export default function App() {
  // Endpoint
  const discovery = useAutoDiscovery('https://accounts.google.com');
  // Request
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: 'CLIENT_ID',
      redirectUri: makeRedirectUri({
        // For usage in bare and standalone
        native: 'com.googleusercontent.apps.GOOGLE_GUID:/oauthredirect',
        useProxy,
      }),
      scopes: ['openid', 'profile'],

      // Optionally should the user be prompted to select or switch accounts
      prompt: Prompt.SelectAccount,

      // Optional
      extraParams: {
        /// Change language
        // hl: 'fr',
        /// Select the user
        // login_hint: 'user@gmail.com',
      },
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      /* @info Exchange the code for an access token in a server. Alternatively you can use the <b>Implicit</b> auth method. */
      const { code } = response.params;
      /* @end */
    }
  }, [response]);

  return (
    <Button
      /* @info Disable the button until the request is loaded asynchronously. */
      disabled={!request}
      /* @end */
      title="Login"
      onPress={() => {
        /* @info Prompt the user to authenticate in a user interaction or web browsers will block it. */
        promptAsync({ useProxy });
        /* @end */
      }}
    />
  );
}
```

</SnackInline>

</AuthCodeTab>

<ImplicitTab>

- PKCE must be disabled in implicit mode (`usePKCE: false`).

<SnackInline label='Google Implicit' dependencies={['expo-auth-session', 'expo-web-browser']}>

```tsx
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import {
  makeRedirectUri,
  ResponseType,
  useAuthRequest,
  useAutoDiscovery,
  Prompt,
} from 'expo-auth-session';
import { Button, Platform } from 'react-native';

/* @info <strong>Web only:</strong> This method should be invoked on the page that the auth popup gets redirected to on web, it'll ensure that authentication is completed properly. On native this does nothing. */
WebBrowser.maybeCompleteAuthSession();
/* @end */

const useProxy = Platform.select({ web: false, default: true });

export default function App() {
  // Endpoint
  const discovery = useAutoDiscovery('https://accounts.google.com');
  // Request
  const [request, response, promptAsync] = useAuthRequest(
    {
      /* @info Request that the server returns an <code>access_token</code>, not all providers support this. */
      responseType: ResponseType.Token,
      /* @end */
      // PKCE must be disabled in implicit mode
      usePKCE: false,
      clientId: 'CLIENT_ID',
      redirectUri: makeRedirectUri({
        // For usage in bare and standalone
        native: 'com.googleusercontent.apps.GOOGLE_GUID:/oauthredirect',
        useProxy,
      }),
      scopes: ['openid', 'profile'],

      // Optionally should the user be prompted to select or switch accounts
      prompt: Prompt.SelectAccount,

      // Optional
      extraParams: {
        /// Change language
        // hl: 'fr',
        /// Select the user
        // login_hint: 'user@gmail.com',
      },
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      /* @info Use this access token to interact with user data on the provider's server. */
      const { access_token } = response.params;
      /* @end */
    }
  }, [response]);

  return (
    <Button
      /* @info Disable the button until the request is loaded asynchronously. */
      disabled={!request}
      /* @end */
      title="Login"
      onPress={() => {
        /* @info Prompt the user to authenticate in a user interaction or web browsers will block it. */
        promptAsync({ useProxy });
        /* @end */
      }}
    />
  );
}
```

</SnackInline>

</ImplicitTab>

<ImplicitTab>

- 🔥 Create a new Firebase project
- Enable Google auth
  - Open "Web SDK configuration"
  - Save "Web client ID" you'll need it later
  - Press Save
- Replace `YOUR_GUID` with your "Web client ID" and open this link:
  - https://console.developers.google.com/apis/credentials/oauthclient/YOUR_GUID.apps.googleusercontent.com
- Under "URIs" add your hosts URLs
  - Web dev: https://localhost:19006
  - Expo Client Proxy: https://auth.expo.io
- Under "Authorized redirect URIs"
  - Web dev: https://localhost:19006 -- this is assuming you want to invoke `WebBrowser.maybeCompleteAuthSession();` from the root URL of your app.
  - Expo Client Proxy: https://auth.expo.io/@yourname/your-app

<img alt="Google Firebase Console for URIs" src="/static/images/sdk/auth-session/guide/google-firebase-auth-console.png" />

<SnackInline label='Google Firebase' dependencies={['expo-auth-session', 'expo-web-browser', 'firebase']}>

```tsx
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, ResponseType, useAuthRequest, useAutoDiscovery, generateHexStringAsync } from 'expo-auth-session';
import firebase from 'firebase';
import { Button, Platform } from 'react-native';

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp({
    /* Config */
  });
}

/* @info <strong>Web only:</strong> This method should be invoked on the page that the auth popup gets redirected to on web, it'll ensure that authentication is completed properly. On native this does nothing. */
WebBrowser.maybeCompleteAuthSession();
/* @end */

const useProxy = Platform.select({ web: false, default: true });

// Generate a random hex string for the nonce parameter
function useNonce() {
  const [nonce, setNonce] = React.useState(null);
  React.useEffect(() => {
    generateHexStringAsync(16).then(value => setNonce(value));
  }, []);
  return nonce;
}

export default function App() {
  const nonce = useNonce();
  // Endpoint
  const discovery = useAutoDiscovery('https://accounts.google.com');
  // Request
  const [request, response, promptAsync] = useAuthRequest(
    {
      /* @info Request that the server returns an <code>id_token</code>, which Firebase expects. */
      responseType: ResponseType.IdToken,
      /* @end */
      /* @info This comes from the Firebase Google authentication panel. */
      clientId: 'Your-Web-Client-ID.apps.googleusercontent.com',
      /* @end */
      redirectUri: makeRedirectUri({
        // For usage in bare and standalone
        native: 'com.googleusercontent.apps.GOOGLE_GUID:/oauthredirect',
        useProxy,
      }),
      scopes: [
        'openid',
        'profile',
        'email',
      ],
      extraParams: {
        nonce,
      }
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      /* @info Use this access token to interact with user data on the provider's server. */
      const { id_token } = response.params;
      /* @end */

      /* @info Create a Google credential with the <code>id_token</code> */
      const credential = firebase.auth.GoogleAuthProvider.credential(id_token);
      /* @end */
      firebase.auth().signInWithCredential(credential);
    }
  }, [response]);

  return (
    <Button
      /* @info Disable the button until the request is loaded asynchronously. */
      disabled={!request || !nonce)}
      /* @end */
      title="Login"
      onPress={() => {
        /* @info Prompt the user to authenticate in a user interaction or web browsers will block it. */
        promptAsync({ useProxy });
        /* @end */
      }}
    />
  );
}
```

</SnackInline>

- 💡 This auth is different because it requires the following to retrieve the `id_token` parameter:
  - `openid` in the `scope`s
  - `responseType` set to `ResponseType.IdToken` (`'id_token'`)
  - `extraParams.nonce` must be defined.

</ImplicitTab>

</AuthMethodTabSwitcher>

<!-- End Google -->

### Okta

<CreateAppButton name="Okta" href="https://developer.okta.com/signup" />

| Website                          | Provider | PKCE      | Auto Discovery |
| -------------------------------- | -------- | --------- | -------------- |
| [Sign-up][c-okta] > Applications | OpenID   | Supported | Available      |

[c-okta]: https://developer.okta.com/signup/

- You cannot define a custom `redirectUri`, Okta will provide you with one.
- You can use the Expo proxy to test this without a native rebuild, just be sure to configure the project as a website.

<AuthMethodTabSwitcher tabs={["Auth Code", "Implicit Flow"]}>
<AuthCodeTab>

<SnackInline label='Okta Auth Code' dependencies={['expo-auth-session', 'expo-web-browser']}>

```tsx
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest, useAutoDiscovery } from 'expo-auth-session';
import { Button, Platform } from 'react-native';

/* @info <strong>Web only:</strong> This method should be invoked on the page that the auth popup gets redirected to on web, it'll ensure that authentication is completed properly. On native this does nothing. */
WebBrowser.maybeCompleteAuthSession();
/* @end */

const useProxy = Platform.select({ web: false, default: true });

export default function App() {
  // Endpoint
  const discovery = useAutoDiscovery('https://<OKTA_DOMAIN>.com/oauth2/default');
  // Request
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: 'CLIENT_ID',
      scopes: ['openid', 'profile'],
      // For usage in managed apps using the proxy
      redirectUri: makeRedirectUri({
        // For usage in bare and standalone
        native: 'com.okta.<OKTA_DOMAIN>:/callback',
        useProxy,
      }),
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      /* @info Exchange the code for an access token in a server. Alternatively you can use the <b>Implicit</b> auth method. */
      const { code } = response.params;
      /* @end */
    }
  }, [response]);

  return (
    <Button
      /* @info Disable the button until the request is loaded asynchronously. */
      disabled={!request}
      /* @end */
      title="Login"
      onPress={() => {
        /* @info Prompt the user to authenticate in a user interaction or web browsers will block it. */
        promptAsync({ useProxy });
        /* @end */
      }}
    />
  );
}
```

</SnackInline>

</AuthCodeTab>

<ImplicitTab>

- This flow is not documented yet, learn more [from the Okta website](https://developer.okta.com/docs/guides/implement-implicit/use-flow/).

</ImplicitTab>

</AuthMethodTabSwitcher>

<!-- End Okta -->

### Reddit

<CreateAppButton name="Reddit" href="https://www.reddit.com/prefs/apps" />

| Website                     | Provider  | PKCE      | Auto Discovery |
| --------------------------- | --------- | --------- | -------------- |
| [Get Your Config][c-reddit] | OAuth 2.0 | Supported | Not Available  |

[c-reddit]: https://www.reddit.com/prefs/apps

- Provider only allows one redirect URI per app. You'll need an individual app for every method you want to use:
  - Expo Client: `exp://localhost:19000/--/*`
  - Expo Client + Proxy: `https://auth.expo.io/@you/your-app`
  - Standalone or Bare: `com.your.app://*`
  - Web: `https://yourwebsite.com/*`
- The `redirectUri` requires 2 slashes (`://`).

<AuthMethodTabSwitcher tabs={["Auth Code", "Implicit Flow"]}>

<AuthCodeTab>

<SnackInline label='Reddit Auth Code' dependencies={['expo-auth-session', 'expo-web-browser']}>

```tsx
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { Button } from 'react-native';

/* @info <strong>Web only:</strong> This method should be invoked on the page that the auth popup gets redirected to on web, it'll ensure that authentication is completed properly. On native this does nothing. */
WebBrowser.maybeCompleteAuthSession();
/* @end */

// Endpoint
const discovery = {
  authorizationEndpoint: 'https://www.reddit.com/api/v1/authorize.compact',
  tokenEndpoint: 'https://www.reddit.com/api/v1/access_token',
};

export default function App() {
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: 'CLIENT_ID',
      scopes: ['identity'],
      // For usage in managed apps using the proxy
      redirectUri: makeRedirectUri({
        // For usage in bare and standalone
        native: 'your.app://redirect',
      }),
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      /* @info Exchange the code for an access token in a server. Alternatively you can use the <b>Implicit</b> auth method. */
      const { code } = response.params;
      /* @end */
    }
  }, [response]);

  return (
    <Button
      /* @info Disable the button until the request is loaded asynchronously. */
      disabled={!request}
      /* @end */
      title="Login"
      onPress={() => {
        /* @info Prompt the user to authenticate in a user interaction or web browsers will block it. */
        promptAsync();
        /* @end */
      }}
    />
  );
}
```

</SnackInline>

</AuthCodeTab>

<ImplicitTab>

- You must select the `installed` option for your app on Reddit to use implicit grant.

<SnackInline label='Reddit Implicit' dependencies={['expo-auth-session', 'expo-web-browser']}>

```tsx
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, ResponseType, useAuthRequest } from 'expo-auth-session';
import { Button } from 'react-native';

/* @info <strong>Web only:</strong> This method should be invoked on the page that the auth popup gets redirected to on web, it'll ensure that authentication is completed properly. On native this does nothing. */
WebBrowser.maybeCompleteAuthSession();
/* @end */

// Endpoint
const discovery = {
  authorizationEndpoint: 'https://www.reddit.com/api/v1/authorize.compact',
  tokenEndpoint: 'https://www.reddit.com/api/v1/access_token',
};

export default function App() {
  const [request, response, promptAsync] = useAuthRequest(
    {
      /* @info Request that the server returns an <code>access_token</code>, not all providers support this. */
      responseType: ResponseType.Token,
      /* @end */
      clientId: 'CLIENT_ID',
      scopes: ['identity'],
      // For usage in managed apps using the proxy
      redirectUri: makeRedirectUri({
        // For usage in bare and standalone
        native: 'your.app://redirect',
      }),
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      /* @info Use this access token to interact with user data on the provider's server. */
      const { access_token } = response.params;
      /* @end */
    }
  }, [response]);

  return (
    <Button
      /* @info Disable the button until the request is loaded asynchronously. */
      disabled={!request}
      /* @end */
      title="Login"
      onPress={() => {
        /* @info Prompt the user to authenticate in a user interaction or web browsers will block it. */
        promptAsync();
        /* @end */
      }}
    />
  );
}
```

</SnackInline>

</ImplicitTab>
</AuthMethodTabSwitcher>

<!-- End Reddit -->

### Slack

<CreateAppButton name="Slack" href="https://api.slack.com/apps" />

| Website                    | Provider  | PKCE      | Auto Discovery |
| -------------------------- | --------- | --------- | -------------- |
| [Get Your Config][c-slack] | OAuth 2.0 | Supported | Not Available  |

[c-slack]: https://api.slack.com/apps

- The `redirectUri` requires 2 slashes (`://`).
- `redirectUri` can be defined under the "OAuth & Permissions" section of the website.
- `clientId` and `clientSecret` can be found in the **"App Credentials"** section.
- Scopes must be joined with ':' so just create one long string.
- Navigate to the **"Scopes"** section to enable scopes.
- `revocationEndpoint` is not available.

<AuthMethodTabSwitcher tabs={["Auth Code", "Implicit Flow"]}>

<AuthCodeTab>

<SnackInline label='Slack Auth Code' dependencies={['expo-auth-session', 'expo-web-browser']}>

```tsx
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { Button } from 'react-native';

/* @info <strong>Web only:</strong> This method should be invoked on the page that the auth popup gets redirected to on web, it'll ensure that authentication is completed properly. On native this does nothing. */
WebBrowser.maybeCompleteAuthSession();
/* @end */

// Endpoint
const discovery = {
  authorizationEndpoint: 'https://slack.com/oauth/authorize',
  tokenEndpoint: 'https://slack.com/api/oauth.access',
};

export default function App() {
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: 'CLIENT_ID',
      scopes: ['emoji:read'],
      // For usage in managed apps using the proxy
      redirectUri: makeRedirectUri({
        // For usage in bare and standalone
        native: 'your.app://redirect',
      }),
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      /* @info Exchange the code for an access token in a server. Alternatively you can use the <b>Implicit</b> auth method. */
      const { code } = response.params;
      /* @end */
    }
  }, [response]);

  return (
    <Button
      /* @info Disable the button until the request is loaded asynchronously. */
      disabled={!request}
      /* @end */
      title="Login"
      onPress={() => {
        /* @info Prompt the user to authenticate in a user interaction or web browsers will block it. */
        promptAsync();
        /* @end */
      }}
    />
  );
}
```

</SnackInline>

</AuthCodeTab>

<ImplicitTab>

- Slack does not support implicit grant.

</ImplicitTab>

</AuthMethodTabSwitcher>

<!-- End Slack -->

### Spotify

<CreateAppButton name="Spotify" href="https://developer.spotify.com/dashboard/applications" />

| Website                      | Provider  | PKCE      | Auto Discovery |
| ---------------------------- | --------- | --------- | -------------- |
| [Get Your Config][c-spotify] | OAuth 2.0 | Supported | Not Available  |

[c-spotify]: https://developer.spotify.com/dashboard/applications

- Learn more about the [Spotify API](https://developer.spotify.com/documentation/web-api/).

<AuthMethodTabSwitcher tabs={["Auth Code", "Implicit Flow"]}>
<AuthCodeTab>

<SnackInline label='Spotify Auth Code' dependencies={['expo-auth-session', 'expo-web-browser']}>

```tsx
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { Button } from 'react-native';

/* @info <strong>Web only:</strong> This method should be invoked on the page that the auth popup gets redirected to on web, it'll ensure that authentication is completed properly. On native this does nothing. */
WebBrowser.maybeCompleteAuthSession();
/* @end */

// Endpoint
const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

export default function App() {
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: 'CLIENT_ID',
      scopes: ['user-read-email', 'playlist-modify-public'],
      // In order to follow the "Authorization Code Flow" to fetch token after authorizationEndpoint
      // this must be set to false
      usePKCE: false,
      // For usage in managed apps using the proxy
      redirectUri: makeRedirectUri({
        // For usage in bare and standalone
        native: 'your.app://redirect',
      }),
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      /* @info Exchange the code for an access token in a server. Alternatively you can use the <b>Implicit</b> auth method. */
      const { code } = response.params;
      /* @end */
    }
  }, [response]);

  return (
    <Button
      /* @info Disable the button until the request is loaded asynchronously. */
      disabled={!request}
      /* @end */
      title="Login"
      onPress={() => {
        /* @info Prompt the user to authenticate in a user interaction or web browsers will block it. */
        promptAsync();
        /* @end */
      }}
    />
  );
}
```

</SnackInline>

</AuthCodeTab>

<ImplicitTab>

<SnackInline label='Spotify Implicit' dependencies={['expo-auth-session', 'expo-web-browser']}>

```tsx
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, ResponseType, useAuthRequest } from 'expo-auth-session';
import { Button } from 'react-native';

/* @info <strong>Web only:</strong> This method should be invoked on the page that the auth popup gets redirected to on web, it'll ensure that authentication is completed properly. On native this does nothing. */
WebBrowser.maybeCompleteAuthSession();
/* @end */

// Endpoint
const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

export default function App() {
  const [request, response, promptAsync] = useAuthRequest(
    {
      /* @info Request that the server returns an <code>access_token</code>, not all providers support this. */
      responseType: ResponseType.Token,
      /* @end */
      clientId: 'CLIENT_ID',
      scopes: ['user-read-email', 'playlist-modify-public'],
      // In order to follow the "Authorization Code Flow" to fetch token after authorizationEndpoint
      // this must be set to false
      usePKCE: false,
      // For usage in managed apps using the proxy
      redirectUri: makeRedirectUri({
        // For usage in bare and standalone
        native: 'your.app://redirect',
      }),
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      /* @info Use this access token to interact with user data on the provider's server. */
      const { access_token } = response.params;
      /* @end */
    }
  }, [response]);

  return (
    <Button
      /* @info Disable the button until the request is loaded asynchronously. */
      disabled={!request}
      /* @end */
      title="Login"
      onPress={() => {
        /* @info Prompt the user to authenticate in a user interaction or web browsers will block it. */
        promptAsync();
        /* @end */
      }}
    />
  );
}
```

</SnackInline>

</ImplicitTab>
</AuthMethodTabSwitcher>

<!-- End Spotify -->

### Strava

<CreateAppButton name="Strava" href="https://www.strava.com/settings/api" />

| Website                     | Provider  | PKCE      | Auto Discovery |
| --------------------------- | --------- | --------- | -------------- |
| [Get Your Config][c-strava] | OAuth 2.0 | Supported | Not Available  |

[c-strava]: https://www.strava.com/settings/api

- Learn more about the [Strava API](http://developers.strava.com/docs/reference/).
- The "Authorization Callback Domain" refers to the final path component of your redirect URI. Ex: In the URI `com.bacon.myapp://redirect` the domain would be `redirect`.
- No Implicit auth flow is provided by Strava.

<AuthMethodTabSwitcher tabs={["Auth Code"]}>
<AuthCodeTab>

<SnackInline label='Strava Auth Code' dependencies={['expo-auth-session', 'expo-web-browser']}>

```tsx
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { Button } from 'react-native';

/* @info <strong>Web only:</strong> This method should be invoked on the page that the auth popup gets redirected to on web, it'll ensure that authentication is completed properly. On native this does nothing. */
WebBrowser.maybeCompleteAuthSession();
/* @end */

// Endpoint
const discovery = {
  authorizationEndpoint: 'https://www.strava.com/oauth/mobile/authorize',
  tokenEndpoint: 'https://www.strava.com/oauth/token',
  revocationEndpoint: 'https://www.strava.com/oauth/deauthorize',
};

export default function App() {
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: 'CLIENT_ID',
      scopes: ['activity:read_all'],
      // For usage in managed apps using the proxy
      redirectUri: makeRedirectUri({
        // For usage in bare and standalone
        // the "redirect" must match your "Authorization Callback Domain" in the Strava dev console.
        native: 'your.app://redirect',
      }),
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      /* @info Exchange the code for an access token in a server. Alternatively you can use the <b>Implicit</b> auth method. */
      const { code } = response.params;
      /* @end */
    }
  }, [response]);

  return (
    <Button
      /* @info Disable the button until the request is loaded asynchronously. */
      disabled={!request}
      /* @end */
      title="Login"
      onPress={() => {
        /* @info Prompt the user to authenticate in a user interaction or web browsers will block it. */
        promptAsync();
        /* @end */
      }}
    />
  );
}
```

Strava doesn't provide an implicit auth flow, you should send the code to a server or serverless function to perform the access token exchange.
For **debugging** purposes, you can perform the exchange client-side using the following method:

```tsx
const { accessToken } = await AuthSession.exchangeCodeAsync(
  {
    clientId: request?.clientId,
    redirectUri,
    code: result.params.code,
    extraParams: {
      // You must use the extraParams variation of clientSecret.
      // Never store your client secret on the client.
      client_secret: 'CLIENT_SECRET',
    },
  },
  { tokenEndpoint: 'https://www.strava.com/oauth/token' }
);
```

</SnackInline>

</AuthCodeTab>

</AuthMethodTabSwitcher>

<!-- End Strava -->

### Twitch

<CreateAppButton name="Twitch" href="https://dev.twitch.tv/console/apps/create" />

| Website                     | Provider | PKCE      | Auto Discovery | Scopes           |
| --------------------------- | -------- | --------- | -------------- | ---------------- |
| [Get your Config][c-twitch] | OAuth    | Supported | Not Available  | [Info][s-twitch] |

[c-twitch]: https://dev.twitch.tv/console/apps/create
[s-twitch]: https://dev.twitch.tv/docs/authentication#scopes

- You will need to enable 2FA on your Twitch account to create an application.

<AuthMethodTabSwitcher tabs={["Auth Code", "Implicit Flow"]}>

<AuthCodeTab>

<SnackInline label='Twitch Auth Code' dependencies={['expo-auth-session', 'expo-web-browser']}>

```tsx
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { Button } from 'react-native';

/* @info <strong>Web only:</strong> This method should be invoked on the page that the auth popup gets redirected to on web, it'll ensure that authentication is completed properly. On native this does nothing. */
WebBrowser.maybeCompleteAuthSession();
/* @end */

// Endpoint
const discovery = {
  authorizationEndpoint: 'https://id.twitch.tv/oauth2/authorize',
  tokenEndpoint: 'https://id.twitch.tv/oauth2/token',
  revocationEndpoint: 'https://id.twitch.tv/oauth2/revoke',
};

export default function App() {
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: 'CLIENT_ID',
      // For usage in managed apps using the proxy
      redirectUri: makeRedirectUri({
        // For usage in bare and standalone
        native: 'your.app://redirect',
      }),
      scopes: ['openid', 'user_read', 'analytics:read:games'],
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      /* @info Exchange the code for an access token in a server. Alternatively you can use the <b>Implicit</b> auth method. */
      const { code } = response.params;
      /* @end */
    }
  }, [response]);

  return (
    <Button
      /* @info Disable the button until the request is loaded asynchronously. */
      disabled={!request}
      /* @end */
      title="Login"
      onPress={() => {
        /* @info Prompt the user to authenticate in a user interaction or web browsers will block it. */
        promptAsync();
        /* @end */
      }}
    />
  );
}
```

</SnackInline>

</AuthCodeTab>

<ImplicitTab>

<SnackInline label='Twitch Implicit' dependencies={['expo-auth-session', 'expo-web-browser']}>

```tsx
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, ResponseType, useAuthRequest } from 'expo-auth-session';
import { Button } from 'react-native';

/* @info <strong>Web only:</strong> This method should be invoked on the page that the auth popup gets redirected to on web, it'll ensure that authentication is completed properly. On native this does nothing. */
WebBrowser.maybeCompleteAuthSession();
/* @end */

// Endpoint
const discovery = {
  authorizationEndpoint: 'https://id.twitch.tv/oauth2/authorize',
  tokenEndpoint: 'https://id.twitch.tv/oauth2/token',
  revocationEndpoint: 'https://id.twitch.tv/oauth2/revoke',
};

export default function App() {
  const [request, response, promptAsync] = useAuthRequest(
    {
      /* @info Request that the server returns an <code>access_token</code>, not all providers support this. */
      responseType: ResponseType.Token,
      /* @end */
      clientId: 'CLIENT_ID',
      // For usage in managed apps using the proxy
      redirectUri: makeRedirectUri({
        // For usage in bare and standalone
        native: 'your.app://redirect',
      }),
      scopes: ['openid', 'user_read', 'analytics:read:games'],
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      /* @info Use this access token to interact with user data on the provider's server. */
      const { access_token } = response.params;
      /* @end */
    }
  }, [response]);

  return (
    <Button
      /* @info Disable the button until the request is loaded asynchronously. */
      disabled={!request}
      /* @end */
      title="Login"
      onPress={() => {
        /* @info Prompt the user to authenticate in a user interaction or web browsers will block it. */
        promptAsync();
        /* @end */
      }}
    />
  );
}
```

</SnackInline>

</ImplicitTab>

</AuthMethodTabSwitcher>

<!-- End Twitch -->

### Uber

<CreateAppButton name="Uber" href="https://developer.uber.com/docs/riders/guides/authentication/introduction" />

| Website                   | Provider  | PKCE      | Auto Discovery |
| ------------------------- | --------- | --------- | -------------- |
| [Get Your Config][c-uber] | OAuth 2.0 | Supported | Not Available  |

[c-uber]: https://developer.uber.com/docs/riders/guides/authentication/introduction

- The `redirectUri` requires 2 slashes (`://`).
- `scopes` can be difficult to get approved.

<AuthMethodTabSwitcher tabs={["Auth Code", "Implicit Flow"]}>

<AuthCodeTab>

<SnackInline label='Uber Auth Code' dependencies={['expo-auth-session', 'expo-web-browser']}>

```tsx
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { Button } from 'react-native';

/* @info <strong>Web only:</strong> This method should be invoked on the page that the auth popup gets redirected to on web, it'll ensure that authentication is completed properly. On native this does nothing. */
WebBrowser.maybeCompleteAuthSession();
/* @end */

// Endpoint
const discovery = {
  authorizationEndpoint: 'https://login.uber.com/oauth/v2/authorize',
  tokenEndpoint: 'https://login.uber.com/oauth/v2/token',
  revocationEndpoint: 'https://login.uber.com/oauth/v2/revoke',
};

export default function App() {
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: 'CLIENT_ID',
      scopes: ['profile', 'delivery'],
      // For usage in managed apps using the proxy
      redirectUri: makeRedirectUri({
        // For usage in bare and standalone
        native: 'your.app://redirect',
      }),
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      /* @info Exchange the code for an access token in a server. Alternatively you can use the <b>Implicit</b> auth method. */
      const { code } = response.params;
      /* @end */
    }
  }, [response]);

  return (
    <Button
      /* @info Disable the button until the request is loaded asynchronously. */
      disabled={!request}
      /* @end */
      title="Login"
      onPress={() => {
        /* @info Prompt the user to authenticate in a user interaction or web browsers will block it. */
        promptAsync();
        /* @end */
      }}
    />
  );
}
```

</SnackInline>

</AuthCodeTab>

<ImplicitTab>

<SnackInline label='Uber Implicit' dependencies={['expo-auth-session', 'expo-web-browser']}>

```tsx
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, ResponseType, useAuthRequest } from 'expo-auth-session';
import { Button } from 'react-native';

/* @info <strong>Web only:</strong> This method should be invoked on the page that the auth popup gets redirected to on web, it'll ensure that authentication is completed properly. On native this does nothing. */
WebBrowser.maybeCompleteAuthSession();
/* @end */

// Endpoint
const discovery = {
  authorizationEndpoint: 'https://login.uber.com/oauth/v2/authorize',
  tokenEndpoint: 'https://login.uber.com/oauth/v2/token',
  revocationEndpoint: 'https://login.uber.com/oauth/v2/revoke',
};

export default function App() {
  const [request, response, promptAsync] = useAuthRequest(
    {
      /* @info Request that the server returns an <code>access_token</code>, not all providers support this. */
      responseType: ResponseType.Token,
      /* @end */
      clientId: 'CLIENT_ID',
      scopes: ['profile', 'delivery'],
      // For usage in managed apps using the proxy
      redirectUri: makeRedirectUri({
        // For usage in bare and standalone
        native: 'your.app://redirect',
      }),
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      /* @info Use this access token to interact with user data on the provider's server. */
      const { access_token } = response.params;
      /* @end */
    }
  }, [response]);

  return (
    <Button
      /* @info Disable the button until the request is loaded asynchronously. */
      disabled={!request}
      /* @end */
      title="Login"
      onPress={() => {
        /* @info Prompt the user to authenticate in a user interaction or web browsers will block it. */
        promptAsync();
        /* @end */
      }}
    />
  );
}
```

</SnackInline>

</ImplicitTab>

</AuthMethodTabSwitcher>

<!-- End Uber -->

<!-- End Guides -->

## Redirect URI patterns

Here are a few examples of some common redirect URI patterns you may end up using.

#### Expo Proxy

> `https://auth.expo.io/@yourname/your-app`

- **Environment:** Development or production projects in the Expo client, or in a standalone build.
- **Create:** Use `AuthSession.makeRedirectUri({ useProxy: true })` to create this URI.
  - The link is constructed from your Expo username and the Expo app name, which are appended to the proxy website.
- **Usage:** `promptAsync({ useProxy: true, redirectUri })`

#### Published project in the Expo Client

> `exp://exp.host/@yourname/your-app`

- **Environment:** Production projects that you `expo publish`'d and opened in the Expo client.
- **Create:** Use `AuthSession.makeRedirectUri({ useProxy: false })` to create this URI.
  - The link is constructed from your Expo username and the Expo app name, which are appended to the Expo client URI scheme.
  - You could also create this link with using `Linking.makeUrl()` from `expo-linking`.
- **Usage:** `promptAsync({ redirectUri })`

#### Development project in the Expo client

> `exp://localhost:19000`

- **Environment:** Development projects in the Expo client when you run `expo start`.
- **Create:** Use `AuthSession.makeRedirectUri({ useProxy: false })` to create this URI.
  - This link is built from your Expo server's `port` + `host`.
  - You could also create this link with using `Linking.makeUrl()` from `expo-linking`.
- **Usage:** `promptAsync({ redirectUri })`

#### Standalone, Bare, or Custom

> `yourscheme://path`

In some cases there will be anywhere between 1 to 3 slashes (`/`).

- **Environment:**
  - Bare-workflow - React Native + Unimodules.
    - `npx create-react-native-app` or `expo eject`
  - Standalone builds in the App or Play Store
    - `expo build:ios` or `expo build:android`
  - Custom Expo client builds
    - `expo client:ios`
- **Create:** Use `AuthSession.makeRedirectUri({ native: '<YOUR_URI>' })` to select native when running in the correct environment.
  - This link must be hard coded because it cannot be inferred from the config reliably, with exception for Standalone builds using `scheme` from `app.config.js` or `app.json`. Often this will be used for providers like Google or Okta which require you to use a custom native URI redirect. You can add, list, and open URI schemes using `npx uri-scheme`.
  - If you change the `expo.scheme` after ejecting then you'll need to use the `expo apply` command to apply the changes to your native project, then rebuild them (`yarn ios`, `yarn android`).
- **Usage:** `promptAsync({ redirectUri })`

## Improving User Experience

The "login flow" is an important thing to get right, in a lot of cases this is where the user will _commit_ to using your app again. A bad experience can cause users to give up on your app before they've really gotten to use it.

Here are a few tips you can use to make authentication quick, easy, and secure for your users!

### Warming the browser

On Android you can optionally warm up the web browser before it's used. This allows the browser app to pre-initialize itself in the background. Doing this can significantly speed up prompting the user for authentication.

```tsx
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';

function App() {
  React.useEffect(() => {
    /* @info <strong>Android only:</strong> Start loading the default browser app in the background to improve transition time. */
    WebBrowser.warmUpAsync();
    /* @end */

    return () => {
      /* @info <strong>Android only:</strong> Cool down the browser when the component unmounts to help improve memory on low-end Android devices. */
      WebBrowser.coolDownAsync();
      /* @end */
    };
  }, []);

  // Do authentication ...
}
```

### Implicit login

You should never store your client secret locally in your bundle because there's no secure way to do this. Luckily a lot of providers have an "Implicit flow" which enables you to request an access token without the client secret. By default `expo-auth-session` requests an exchange code as this is the most widely applicable login method.

Here is an example of logging into Spotify without using a client secret.

```tsx
import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { useAuthRequest, ResponseType } from 'expo-auth-session';

/* @info <strong>Web only:</strong> This method should be invoked on the page that the auth popup gets redirected to on web, it'll ensure that authentication is completed properly. On native this does nothing. */
WebBrowser.maybeCompleteAuthSession();
/* @end */

// Endpoint
const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
};

function App() {
  const [request, response, promptAsync] = useAuthRequest(
    {
      /* @info Request that the server returns an <code>access_token</code>, not all providers support this. */
      responseType: ResponseType.Token,
      /* @end */
      clientId: 'CLIENT_ID',
      scopes: ['user-read-email', 'playlist-modify-public'],
      redirectUri: makeRedirectUri({
        native: 'your.app://redirect',
      }),
    },
    discovery
  );

  React.useEffect(() => {
    if (response && response.type === 'success') {
      /* @info You can use this access token to make calls into the Spotify API. */
      const token = response.params.access_token;
      /* @end */
    }
  }, [response]);

  return <Button disabled={!request} onPress={() => promptAsync()} title="Login" />;
}
```

### Storing data

On native platforms like iOS, and Android you can secure things like access tokens locally using a package called [`expo-secure-store`](/versions/latest/sdk/securestore) (This is different to `AsyncStorage` which is not secure). This package provides native access to [keychain services](https://developer.apple.com/documentation/security/keychain_services) on iOS and encrypted [`SharedPreferences`](https://developer.android.com/training/basics/data-storage/shared-preferences.html) on Android. There is no web equivalent to this functionality.

You can store your authentication results and rehydrate them later to avoid having to prompt the user to login again.

```tsx
import * as SecureStore from 'expo-secure-store';

const MY_SECURE_AUTH_STATE_KEY = 'MySecureAuthStateKey';

function App() {
  const [, response] = useAuthRequest({});

  React.useEffect(() => {
    if (response && response.type === 'success') {
      const auth = response.params;
      const storageValue = JSON.stringify(auth);

      if (Platform.OS !== 'web') {
        // Securely store the auth on your device
        SecureStore.setItemAsync(MY_SECURE_AUTH_STATE_KEY, storageValue);
      }
    }
  }, [response]);

  // More login code...
}
```

[userinfo]: https://openid.net/specs/openid-connect-core-1_0.html#UserInfo
[provider-meta]: https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata
[oidc-dcr]: https://openid.net/specs/openid-connect-discovery-1_0.html#OpenID.Registration
[oidc-autherr]: https://openid.net/specs/openid-connect-core-1_0.html#AuthError
[oidc-authreq]: https://openid.net/specs/openid-connect-core-1_0.html#AuthorizationRequest
