import { CodedError } from '@unimodules/core';

import { FacebookAuth } from './Facebook';
import {
  FacebookLoginResult,
  FacebookOptions,
  InitOptions,
  SDKScriptURLOptions,
} from './Facebook.types';

declare var window: Window & { FB: fb.FacebookStatic; fbAsyncInit?: () => void };

const SCRIPT_ID = 'expo-facebook-generated-fbsdk-script';

let loadingFBSDKPromise: Promise<fb.FacebookStatic>;

let autoLogAppEvents: boolean = true;
let lastAppId: string;

// FBSDK promises

function getLoginStatusAsync(): Promise<fb.StatusResponse> {
  return new Promise(resolve => window.FB.getLoginStatus(resolve));
}
function logoutAsync(): Promise<fb.StatusResponse> {
  return new Promise(resolve => window.FB.logout(resolve));
}
function loginAsync(options?: fb.LoginOptions): Promise<fb.StatusResponse> {
  return new Promise(resolve => window.FB.login(resolve, options));
}

// Helper

function throwIfUninitialized() {
  if (!window || !window.FB)
    throw new CodedError(
      'ERR_FB_INIT',
      'FBSDK is not initialized. Ensure `initializeAsync` has successfully resolved before attempting to use the FBSDK.'
    );
}

function getScriptElement({
  domain = 'connect.facebook.net',
  language = 'en_US',
  isCustomerSupportChatEnabled = false,
  isDebugEnabled = false,
}: SDKScriptURLOptions): HTMLScriptElement {
  const scriptUrl = `https://${domain}/${language}/sdk${
    isCustomerSupportChatEnabled ? '/xfbml.customerchat' : ''
  }${isDebugEnabled ? '/debug' : ''}.js`;

  const scriptElement = document.createElement('script');
  scriptElement.async = true;
  scriptElement.defer = true;
  scriptElement.id = SCRIPT_ID;
  scriptElement.src = scriptUrl;
  return scriptElement;
}

function ensurePermissionsAreArray(permissions?: string | string[]): string[] {
  if (!permissions) return [];

  if (Array.isArray(permissions)) {
    return permissions;
  }
  return permissions.split(',');
}

export default {
  get name(): string {
    return 'ExponentFacebook';
  },
  async initializeAsync({
    appId,
    version = 'v5.0',
    xfbml = true,
    ...options
  }: InitOptions): Promise<fb.FacebookStatic> {
    if (!appId) {
      throw new CodedError(
        'ERR_FB_CONF',
        `Failed to initialize app because the appId wasn't provided.`
      );
    }
    // Account for the script tag being added manually.
    if (window && window.FB) {
      return window.FB;
    }
    // Prevent concurrent tasks
    if (loadingFBSDKPromise) {
      return loadingFBSDKPromise;
    }

    loadingFBSDKPromise = new Promise(resolve => {
      lastAppId = appId;
      // The function assigned to window.fbAsyncInit is run as soon as the SDK has completed loading.
      // Any code that you want to run after the SDK is loaded should be placed within this function and after the call to FB.init.
      // Any kind of JavaScript can be used here, but any SDK functions must be called after FB.init.
      window.fbAsyncInit = () => {
        // https://developers.facebook.com/docs/javascript/reference/FB.init/v5.0
        window.FB.init({
          appId,
          autoLogAppEvents:
            options.autoLogAppEvents === undefined ? autoLogAppEvents : options.autoLogAppEvents,
          xfbml,
          version,
        });

        resolve(window.FB);
      };

      // If the script tag exists then resolve without creating a new one.
      const element = document.getElementById(SCRIPT_ID);
      if (element) {
        resolve(window.FB);
      }

      document.body.appendChild(
        getScriptElement({
          domain: options.domain,
          language: options.language,
          isDebugEnabled: options.isDebugEnabled,
          isCustomerSupportChatEnabled: options.isCustomerSupportChatEnabled,
        })
      );
    });

    return loadingFBSDKPromise;
  },
  /**
   * https://developers.facebook.com/docs/reference/javascript/FB.login/v5.0
   *
   * @param options
   */
  async logInWithReadPermissionsAsync(options: FacebookOptions): Promise<FacebookLoginResult> {
    throwIfUninitialized();

    const { permissions = ['public_profile', 'email'] } = options;

    const loginOptions: fb.LoginOptions = {
      scope: permissions.join(','),
      return_scopes: true,
    };

    const response = await loginAsync(loginOptions);

    if (response.authResponse) {
      const authResponse = response.authResponse as fb.AuthResponse & {
        graphDomain: string;
        data_access_expiration_time: number;
      };

      return {
        type: 'success',
        appID: lastAppId,
        expires: authResponse.expiresIn,
        token: authResponse.accessToken,
        userID: authResponse.userID,
        signedRequest: authResponse.signedRequest,
        graphDomain: authResponse.graphDomain,
        dataAccessExpires: authResponse.data_access_expiration_time,
        permissions: ensurePermissionsAreArray(authResponse.grantedScopes),
      };
    }

    return { type: 'cancel' };
  },

  async getAccessTokenAsync(): Promise<FacebookAuth | null> {
    throwIfUninitialized();

    const response = await getLoginStatusAsync();
    if (!response.authResponse) {
      return null;
    }

    const authResponse = response.authResponse as fb.AuthResponse & {
      graphDomain: string;
      data_access_expiration_time: number;
    };

    return {
      appID: lastAppId,
      // TODO: Bacon: Ensure expiresIn is returned in the correct format
      expires: authResponse.expiresIn,
      token: authResponse.accessToken,
      userID: authResponse.userID,
      signedRequest: authResponse.signedRequest,
      graphDomain: authResponse.graphDomain,
      dataAccessExpires: authResponse.data_access_expiration_time,
      permissions: ensurePermissionsAreArray(authResponse.grantedScopes),
    };
  },
  async logOutAsync(): Promise<void> {
    throwIfUninitialized();

    // Check if the user is already authenticated before attempting to log out.
    // This will prevent the FBSDK from throwing a cryptic error message about not providing a token.
    const auth = await this.getAccessTokenAsync();
    if (!auth) return;

    await logoutAsync();
  },
  setAutoLogAppEventsEnabledAsync(enabled: boolean) {
    autoLogAppEvents = enabled;
  },
};
