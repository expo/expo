import { CodedError } from '@unimodules/core';

import { FacebookAuth } from './Facebook';
import {
  FacebookLoginResult,
  SDKScriptURLOptions,
  FacebookOptions,
  InitOptions,
} from './Facebook.types';

type FB = any;

declare var window: Window & { FB: FB; fbAsyncInit: Function };

const SCRIPT_ID = 'expo-facebook-generated-fbsdk-script';

let loadingFBSDKPromise: Promise<FB>;

let autoLogAppEvents: boolean = true;
let lastAppId: string;

function throwIfUninitialized() {
  if (!window.FB)
    throw new CodedError(
      'E_FB_CONF_ERROR',
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

function ensurePermissionsAreArray(permissions: string | string[]): string[] {
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
  }: InitOptions): Promise<FB> {
    if (!appId) {
      throw new CodedError(
        'E_FB_INIT',
        `Failed to initialize app because the appId wasn't provided.`
      );
    }
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
      if (element && element instanceof HTMLScriptElement) {
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

    return new Promise(resolve => {
      window.FB.login(
        response => {
          if (response.authResponse) {
            resolve({
              type: 'success',
              token: response.authResponse.accessToken,
              permissions: ensurePermissionsAreArray(response.authResponse.grantedScopes),
              expires: response.authResponse.data_access_expiration_time,
              // TODO: Add these if possible
              declinedPermissions: [],
            });
          } else {
            resolve({ type: 'cancel' });
          }
        },
        {
          scopes: permissions.join(','),
          return_scopes: true,
        }
      );
    });
  },

  async getAccessTokenAsync(): Promise<FacebookAuth | null> {
    throwIfUninitialized();
    return new Promise(resolve => {
      window.FB.getLoginStatus(response => {
        resolve(
          response.authResponse
            ? {
                appID: lastAppId,
                expires: response.authResponse.expires,
                token: response.authResponse.accessToken,
                userID: response.authResponse.userID,
                signedRequest: response.authResponse.signedRequest,
                graphDomain: response.authResponse.graphDomain,
                dataAccessExpires: response.authResponse.data_access_expiration_time,
              }
            : null
        );
      });
    });
  },
  async logOutAsync(): Promise<void> {
    throwIfUninitialized();

    // Prevent FB throwing a cryptic error message.
    const auth = await this.getAccessTokenAsync();
    if (!auth) return;

    return new Promise(resolve => {
      window.FB.logout(() => {
        resolve();
      });
    });
  },
  setAutoLogAppEventsEnabledAsync(enabled: boolean) {
    autoLogAppEvents = enabled;
  },
};
