---
title: Facebook
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-36/packages/expo-facebook'
---

**`expo-facebook`** provides Facebook integration, such as logging in through Facebook, for React Native apps. Expo exposes a minimal native API since you can access Facebook's [Graph API](https://developers.facebook.com/docs/graph-api) directly through HTTP (using [fetch](https://facebook.github.io/react-native/docs/network.html#fetch), for example).

#### Platform Compatibility

| Android Device | Android Emulator | iOS Device | iOS Simulator | Web |
| -------------- | ---------------- | ---------- | ------------- | --- |
| ✅             | ✅               | ✅         | ✅            | ✅  |

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-facebook`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-facebook).

For ejected (see: [ExpoKit](../../expokit/overview)) apps, here are links to the [iOS Installation Walkthrough](https://developers.facebook.com/docs/ios/getting-started/) and the [Android Installation Walkthrough](https://developers.facebook.com/docs/android/getting-started).

## Configuration

### Registering your app with Facebook

Follow [Facebook's developer documentation](https://developers.facebook.com/docs/apps/register) to register an application with Facebook's API and get an application ID. Take note of this application ID because it will be used as the `appId` option in your [`Facebook.logInWithReadPermissionsAsync`](#expofacebookloginwithreadpermissionsasync 'Facebook.logInWithReadPermissionsAsync') call. Then follow these steps based on the platforms you're targetting. This will need to be done from the [Facebook developer site](https://developers.facebook.com/):

- **The Expo client app**

  - Add `host.exp.Exponent` as an iOS _Bundle ID_. Add `rRW++LUjmZZ+58EbN5DVhGAnkX4=` as an Android _key hash_. Your app's settings should end up including the following under "Settings > Basic":

![](/static/images/facebook-app-settings.png)

- **iOS standalone app**

  - Add your app's Bundle ID as a _Bundle ID_ in the app settings page pictured above. If you still have the `host.exp.Exponent` ID listed there, remove it.
  - In your [app.json](../../workflow/configuration/), add a field `facebookScheme` with your Facebook login redirect URL scheme found [here](https://developers.facebook.com/docs/facebook-login/ios) under _4. Configure Your info.plist_. It should look like `"fb123456"`.
  - Also in your [app.json](../../workflow/configuration/), add your [Facebook App ID and Facebook Display Name](https://developers.facebook.com/docs/facebook-login/ios) under the `facebookAppId` and `facebookDisplayName` keys.

- **Android standalone app**

  - [Build your standalone app](../../distribution/building-standalone-apps/#building-standalone-apps) for Android.
  - Run `expo fetch:android:hashes`.
  - Copy `Facebook Key Hash` and paste it as an additional key hash in your Facebook developer page pictured above.

You may have to switch the app from 'development mode' to 'public mode' on the Facebook developer page before other users can log in.

- **Web**
  - This web guide was written in January 2020 (FBSDK is known to have breaking changes *very* often).
  - Projects must be secure (using `https`) and using `localhost`. Start your project with `expo start:web --https --localhost`.
  - In the Facebook Developer Console be sure to add `localhost` to the "App Domains".
  - You'll need to whitelist `localhost` by navigating to **Settings > Basic > Add Platform** and selecting "Website". 
    - From here set the "Site URL" to `https://localhost:19006` for debugging. You'll want to change this to your production website URL later.
    - If you don't do this you may see the following error when attempting to log out: `"Refused to display 'https://www.facebook.com/home.php' in a frame because it set 'X-Frame-Options' to 'deny'."`
  - Define "Valid OAuth Redirect URIs" for login to work
    - Navigate to **Facebook Login > Settings** and paste the URL of your OAuth redirect.
    - A simple way to set this up is by creating a JS Firebase app and enabling Facebook auth, this will automatically create an OAuth redirect for you.
    - Attempting to login without this will present an error in the external browser window opened by the FBSDK.

## API

```js
import * as Facebook from 'expo-facebook';
```

### `Facebook.initializeAsync(options: InitOptions): Promise<void>`

Calling this method ensures that the SDK is initialized. You have to call this method before calling any method that uses the FBSDK (ex: `logInWithReadPermissionsAsync`, `logOutAsync`) to ensure that Facebook support is initialized properly.

- On native platforms you can optional provide an `appId` argument. 
  - If you don't provide it, Facebook SDK will try to use `appId` from native app resources (which in standalone apps you would define in `app.json`, in Expo client are unavailable and in bare you configure yourself according to Facebook setup documentation for [iOS](https://developers.facebook.com/docs/facebook-login/ios#4--configure-your-project) and [Android](https://developers.facebook.com/docs/facebook-login/android#manifest)). If it fails to find one, the promise will be rejected.
  - The same resolution mechanism works for `appName`.
- On web `appId` and `version` options must be included to start the app. This method downloads the JS FBSDK script, which will generate a side-effect of `window.FB` globally.
- If you provide an explicit `appId`, it will override any other source.

#### param object options

A map of options:

- `InitOptions` type:

  - **appId (_string | undefined_)** Application ID used to initialize the FBSDK app. On web this is required, not providing it will result in a `ERR_FB_CONF` error. On native if you don't provide this, Facebook SDK will try to use `appId` from native app resources (which in standalone apps you would define in `app.json`, in Expo client are unavailable, and in bare you configure yourself according to Facebook setup documentation for [iOS](https://developers.facebook.com/docs/facebook-login/ios#4--configure-your-project) and [Android](https://developers.facebook.com/docs/facebook-login/android#manifest)). If it fails to find one, the promise will be rejected.
  - **version (_string | undefined_)** Required for web. Selects the [version of FBSDK](https://developers.facebook.com/docs/javascript/reference/FB.init/v5.0) to use.
  - **appName (_string | undefined_)** An optional Facebook App Name argument for iOS and Android.
  - **autoLogAppEvents (_boolean | undefined_)** Sets whether Facebook SDK should log app events. App events involve app eg. installs, app launches (more info [here](https://developers.facebook.com/docs/app-events/getting-started-app-events-android/#auto-events) and [here](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios#auto-events)). In some cases, you may want to disable or delay the collection of automatically logged events, such as to obtain user consent or fulfill legal obligations. This method corresponds to [this](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios#disable-auto-events) and [this](https://developers.facebook.com/docs/app-events/getting-started-app-events-android/#disable-auto-events) native SDK methods.
  - **domain (_string | undefined_)** Web, Android: Sets the base Facebook domain to use when making Web requests. Defaults to: `'connect.facebook.net'`.
  - **isDebugEnabled (_boolean_)** Web only: Loads the JS SDK in an non-minified format with more logs and stricter type checking. This shouldn't be enabled in your production environment, as its payload is larger and is worse for the performance of your page. Defaults to `false`
  - **isCustomerSupportChatEnabled (_boolean_)** Web only: Enables the [customer chat plugin](https://developers.facebook.com/docs/messenger-platform/discovery/customer-chat-plugin/sdk/). Defaults to `false`.
  - **xfbml (_boolean_)** Web only: With xfbml set to true, the SDK will parse your page's DOM to find and initialize any social plugins that have been added using XFBML. If you're not using social plugins on the page, setting `xfbml` to `false` will improve page load times. You can find out more about this by looking at [Social Plugins](https://developers.facebook.com/docs/plugins/). Defaults to `true`


### `Facebook.setAutoInitEnabledAsync(enabled: boolean): Promise<void>`

Sets whether Facebook SDK should autoinitialize itself. SDK initialization involves eg. fetching app settings from Facebook or a profile of the logged in user. In some cases, you may want to disable or delay the SDK initialization, such as to obtain user consent or fulfill legal obligations. This method corresponds to [this](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios#disable-sdk-initialization) and [this](https://developers.facebook.com/docs/app-events/getting-started-app-events-android/#disable-sdk-initialization) native SDK methods. Even though calling this method with `enabled == true` initializes the Facebook SDK on iOS, it does not on Android and we recommend always calling `initializeAsync` before performing any actions with effects that should be visible to the user (like `loginWithPermissions`).

In Expo, by default, autoinitialization of the Facebook SDK is disabled. You may change this value in runtime by calling this method or customize this feature in buildtime by setting appropriate `app.json` fields. The setting value is persisted across runs (value set with this method overriddes value from buildtime).

### `Facebook.setAutoLogAppEventsEnabledAsync(enabled: boolean): Promise<void>`

Sets whether Facebook SDK should log app events. App events involve app eg. installs, app launches (more info [here](https://developers.facebook.com/docs/app-events/getting-started-app-events-android/#auto-events) and [here](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios#auto-events)). In some cases, you may want to disable or delay the collection of automatically logged events, such as to obtain user consent or fulfill legal obligations. This method corresponds to [this](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios#disable-auto-events) and [this](https://developers.facebook.com/docs/app-events/getting-started-app-events-android/#disable-auto-events) native SDK methods.

In Expo, by default, automatic logging app events is disabled. You may change this value in runtime by calling this method or customize this feature in buildtime by setting appropriate `app.json` fields. The setting value is persisted across runs (value set with this method overriddes value from buildtime).

### `Facebook.setAdvertiserIDCollectionEnabledAsync(enabled: boolean): Promise<void>`

Sets whether Facebook SDK should collect and attach `advertiser-id` to sent events. `advertiser-id` let you identify and target specific customers. To learn more visit [Facebook documentation](https://developers.facebook.com/docs/app-ads/targeting/mobile-advertiser-ids) describing that topic. In some cases, you may want to disable or delay the collection of `advertiser-id`, such as to obtain user consent or fulfill legal obligations. This method corresponds to [this](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios#disable-advertiser-id) and [this](https://developers.facebook.com/docs/app-events/getting-started-app-events-android/#disable-advertiser-id) native SDK methods.

In Expo, by default, collecting those IDs is disabled. You may change this value in runtime by calling this method or customize this feature in buildtime by setting appropriate `app.json` fields. The setting value is persisted across runs (value set with this method overriddes value from buildtime).

### `Facebook.logInWithReadPermissionsAsync(options)`

Prompts the user to log into Facebook and grants your app permission
to access their Facebook data. On iOS and Android, if the Facebook app isn't installed then a web view will be used to authenticate.

#### param object options

A map of options:

- **permissions (_array_)** -- An array specifying the permissions to ask for from Facebook for this login. The permissions are strings as specified in the [Facebook API documentation](https://developers.facebook.com/docs/facebook-login/permissions). The default permissions are `['public_profile', 'email']`.

#### Returns

If the user or Facebook cancelled the login, returns `{ type: 'cancel' }`.

Otherwise, returns `{ type: 'success' } & FacebookAuth`.

- `FacebookAuth` type:

  - **token (_string_)** Access token for the authenticated session. This'll provide access to use with Facebook Graph API.
  - **userID (_string_)** The ID of the user.
  - **appID (_string_)** Application ID used to initialize the FBSDK app.
  - **permissions (_string[] | undefined_)** List of granted permissions.
  - **declinedPermissions (_string[] | undefined_)** List of requested permissions that the user has declined.
  - **expiredPermissions (_string[] | undefined_)** List of permissions that were expired with this access token.
  - **expires (_number_)** Gets the time in milliseconds at which the `token` expires.
  - **dataAccessExpires (_number_)** Time in milliseconds at which the current user data access expires.
  - **refresh (_number | undefined_)** The last time in milliseconds the `token` was refreshed (or when it was first obtained).
  - **tokenSource (_string | undefined_)** Android: Indicates how this `token` was obtained.
  - **signedRequest (_string | undefined_)** A valid raw signed request as a string.
  - **graphDomain (_string | undefined_)** A website domain within the Graph API.

#### Example

```javascript
async function logIn() {
  try {
    await Facebook.initializeAsync({ 
      appId: '<APP_ID>', 
      version: Platform.select({
        web: '<VERSION>', // ex: 'v5.0'
      }),
    });
    const {
      type,
      token,
      expires,
      permissions,
      declinedPermissions,
    } = await Facebook.logInWithReadPermissionsAsync({
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

Given a valid Facebook application ID in place of `<APP_ID>`, the code above will prompt the user to log into Facebook then display the user's name. This uses React Native's [fetch](https://facebook.github.io/react-native/docs/network.html#fetch) to query Facebook's [Graph API](https://developers.facebook.com/docs/graph-api).

### `Facebook.logOutAsync()`

Logs out of the currently authenticated session.

- [Web Functionality](https://developers.facebook.com/docs/reference/javascript/FB.logout) can be unstable and may require reloading the page before `Facebook.getAccessTokenAsync()` returns `null` again.

### `Facebook.getAccessTokenAsync()`

Returns the `FacebookAuth` object if a user is authenticated, and `null` if no valid authentication exists.

You can use this method to check if the user should sign-in or not.

#### returns 

- `FacebookAuth` type:

  - **token (_string_)** Access token for the authenticated session. This'll provide access to use with Facebook Graph API.
  - **userID (_string_)** The ID of the user.
  - **appID (_string_)** Application ID used to initialize the FBSDK app.
  - **permissions (_string[] | undefined_)** List of granted permissions.
  - **declinedPermissions (_string[] | undefined_)** List of requested permissions that the user has declined.
  - **expiredPermissions (_string[] | undefined_)** List of permissions that were expired with this access token.
  - **expires (_number_)** Gets the time in milliseconds at which the `token` expires.
  - **dataAccessExpires (_number_)** Time in milliseconds at which the current user data access expires.
  - **refresh (_number | undefined_)** The last time in milliseconds the `token` was refreshed (or when it was first obtained).
  - **tokenSource (_string | undefined_)** Android: Indicates how this `token` was obtained.
  - **signedRequest (_string | undefined_)** A valid raw signed request as a string.
  - **graphDomain (_string | undefined_)** A website domain within the Graph API.

```tsx
async function toggleAuthAsync() {
  const auth = await Facebook.getAccessTokenAsync();

  if (!auth) {
    // Log in
  } else {
    // Log out
  }
}
```

## Error Codes

### `ERR_FB_INIT`

Ensure `initializeAsync` has successfully resolved before attempting to use the FBSDK.

### `ERR_FB_CONF`

Failed to initialize the FBSDK app because the `appId` option wasn't provided and the `appId` couldn't be resolved automatically from the native config files. On web the `appId` option is required when invoking `initializeAsync({ ... })`.

### `ERR_FB_LOGIN`

An error occurred while trying to log in to Facebook.
