export type FacebookAuthenticationCredential = {
  /**
   * Access token for the authenticated session. This token provides access to the Facebook Graph API.
   */
  token: string;
  /**
   * App-scoped Facebook ID of the user.
   */
  userId: string;
  /**
   * Application ID used to initialize the Facebook SDK app.
   */
  appId: string;
  /**
   * List of granted permissions.
   */
  permissions?: string[];
  /**
   * List of requested permissions that the user has declined.
   */
  declinedPermissions?: string[];
  /**
   * List of permissions that were expired with this access token.
   */
  expiredPermissions?: string[];
  /**
   * Time at which the `token` expires.
   */
  expirationDate: Date;
  /**
   * Time at which the current user data access expires.
   */
  dataAccessExpirationDate: Date;
  /**
   * The last time the `token` was refreshed (or when it was first obtained)
   */
  refreshDate?: Date;
  /**
   * _(Android only)_ Indicates how this `token` was obtained.
   */
  tokenSource?: string;
  /**
   * A valid raw signed request as a string.
   */
  signedRequest?: string;
  /**
   * A website domain within the Graph API.
   *
   * https://developers.facebook.com/docs/graph-api/reference/v5.0/domain
   */
  graphDomain?: string;
};

export type FacebookLoginResult =
  | {
      type: 'cancel';
    }
  | ({
      type: 'success';
    } & FacebookAuthenticationCredential);

export type FacebookOptions = {
  permissions?: string[];
};

export type FacebookSDKScriptURLOptions = {
  /**
   * Android: Sets the base Facebook domain to use when making network requests.
   * Defaults to: 'connect.facebook.net'
   */
  domain?: string;
};

export type FacebookSDKInitializationOptions = {
  /**
   * Application ID used to initialize the FBSDK app.
   *
   * On Android and iOS if you don't provide this, Facebook SDK will try to use `appId` from Android and iOS.
   * app resources (which in standalone apps you would define in `app.json`, in the Expo client are unavailable, and in bare you configure yourself according to Facebook setup documentation for [iOS](https://developers.facebook.com/docs/facebook-login/ios#4--configure-your-project) and [Android](https://developers.facebook.com/docs/facebook-login/android#manifest)).
   * If it fails to find one, the promise will be rejected.
   */
  appId?: string;
  /**
   * Selects the version of FBSDK to use.
   *
   * https://developers.facebook.com/docs/javascript/reference/FB.init/v5.0
   */
  version?: string;
  /**
   * Sets whether Facebook SDK should log app events. App events involve app eg. installs, app launches (more info [here](https://developers.facebook.com/docs/app-events/getting-started-app-events-android/#auto-events) and [here](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios#auto-events)).
   * In some cases, you may want to disable or delay the collection of automatically logged events, such as to obtain user consent or fulfill legal obligations.
   *
   * This method corresponds to:
   * - [iOS disable auto events](https://developers.facebook.com/docs/app-events/getting-started-app-events-ios#disable-auto-events)
   * - [Android disable auto events](https://developers.facebook.com/docs/app-events/getting-started-app-events-android/#disable-auto-events)
   */
  autoLogAppEvents?: boolean;
};

export type FacebookNativeInitializationOptions = {
  /**
   * An optional Facebook App Name argument for iOS and Android.
   */
  appName?: string;
};

export type FacebookInitializationOptions = FacebookSDKScriptURLOptions &
  FacebookSDKInitializationOptions &
  FacebookNativeInitializationOptions;
