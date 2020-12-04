---
title: AuthSession
sourceCodeUrl: 'https://github.com/expo/expo/blob/sdk-36/packages/expo/src/AuthSession.ts'
---

import PlatformsSection from '~/components/plugins/PlatformsSection';

`AuthSession` is the easiest way to add web browser based authentication (for example, browser-based OAuth flows) to your app, built on top of [WebBrowser](webbrowser.md). If you would like to understand how it does this, read this document from top to bottom. If you just want to use it, jump to the [Example](#example).

<PlatformsSection android emulator ios simulator />

## Installation

This API is pre-installed in [managed](../../../introduction/managed-vs-bare.md#managed-workflow) apps. It is not available for [bare](../../../introduction/managed-vs-bare.md#bare-workflow) React Native apps.

## How web browser based authentication flows work

The typical flow for browser-based authentication in mobile apps is as follows:

- **Initiation**: the user presses a sign in button
- **Open web browser**: the app opens up a web browser to the authentication provider sign in page. The url that is opened for the sign in page usually includes information to identify the app, and a URL to redirect to on success. _Note: the web browser should share cookies with your system web browser so that users do not need to sign in again if they are already authenticated on the system browser -- Expo's [WebBrowser](webbrowser.md) API takes care of this._
- **Authentication provider redirects**: upon successful authentication, the authentication provider should redirect back to the application by redirecting to URL provided by the app in the query parameters on the sign in page ([read more about how linking works in mobile apps](../../../workflow/linking.md)), _provided that the URL is in the whitelist of allowed redirect URLs_. Whitelisting redirect URLs is important to prevent malicious actors from pretending to be your application. The redirect includes data in the URL (such as user id and token), either in the location hash, query parameters, or both.
- **App handles redirect**: the redirect is handled by the app and data is parsed from the redirect URL.

## What `AuthSession` does for you

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

<!-- prettier-ignore -->
```javascript
import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { AuthSession } from 'expo';

/* @info Replace <strong>'YOUR_APP_ID'</strong> with your application id from <a href='https://developers.facebook.com' target='_blank'>developers.facebook.com</a> */
const FB_APP_ID = 'YOUR_APP_ID';
/* @end */

export default class App extends React.Component {
  state = {
    result: null,
  };

  render() {
    return (
      <View style={styles.container}>
        <Button title="Open FB Auth" onPress={this._handlePressAsync} />
        /* @info In this example, show the authentication result after success. In a real application,
        this would be a weird thing to do, instead you would use this data to match the user with a user
        in your application and sign them in. */
        {this.state.result ? <Text>{JSON.stringify(this.state.result)}</Text> : null}
        /* @end */
      </View>
    );
  }

  _handlePressAsync = async () => {
    let redirectUrl = /* @info <strong>AuthSession.getRedirectUrl()</strong> gets the appropriate URL on <em>https://auth.expo.io</em> to redirect back to your application. Read more about it below. */ AuthSession.getRedirectUrl(); /* @end */

    let result = /* @info <strong>AuthSession.startAsync</strong> returns a Promise that resolves to an object with the information that was passed back from your authentication provider, for example the user id. */ await AuthSession.startAsync(
      /* @end */ {
        /* @info authUrl is a required parameter -- it is the URL that points to the sign in page for your chosen authentication service (in this case, we are using Facebook sign in) */ /* @end */

        authUrl:
          /* @info The particular URL and the format you need to use for this depend on your authentication service. For Facebook, information was found <a href='https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow/' target='_blank'>here</a>.*/ `https://www.facebook.com/v2.8/dialog/oauth?response_type=token` /* @end */ +
          `&client_id=${FB_APP_ID}` +
          `&redirect_uri=${
            /* @info Be sure to call <a href='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent'>encodeURIComponent</a> on any query parameters, or use a library such as <a href='https://github.com/ljharb/qs'>qs</a>. */ encodeURIComponent(
              redirectUrl
            ) /* @end */
          }`,
      }
    );
    this.setState({ result });
  };
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
import { AuthSession } from 'expo';
```

### `AuthSession.startAsync(options)`

Initiate an authentication session with the given options. Only one `AuthSession` can be active at any given time in your application; if you attempt to open a second session while one is still in progress, the second session will return a value to indicate that `AuthSession` is locked.

#### Arguments

- **options (_object_)** --

  A map of options:

  - **authUrl (_string_)** -- **Required**. The URL that points to the sign in page that you would like to open the user to.

  - **returnUrl (_string_)** -- The URL to return to the application. Defaults to `${Constants.linkingUrl}expo-auth-session`, for example `exp://expo.io/@yourname/your-app-slug+expo-auth-session`.

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

Get the URL that your authentication provider needs to redirect to. For example: `https://auth.expo.io/@your-username/your-app-slug`.

## Advanced usage

### Filtering out AuthSession events in Linking handlers

There are many reasons why you might want to handle inbound links into your app, such as push notifications or just regular deep linking (you can read more about this in the [Linking guide](../../../workflow/linking.md)); authentication redirects are only one type of deep link, and `AuthSession` handles these particular links for you. In your own `Linking.addEventListener` handlers, you can filter out deep links that are handled by `AuthSession` by checking if the URL includes the `+expo-auth-session` string -- if it does, you can ignore it. This works because `AuthSession` adds `+expo-auth-session` to the default `returnUrl`; however, if you provide your own `returnUrl`, you may want to consider adding a similar identifier to enable you to filter out `AuthSession` events from other handlers.

#
