import {
  AuthorizationError,
  AuthorizationRequest,
  AuthorizationRequestHandler,
  AuthorizationRequestResponse,
  AuthorizationResponse,
  BasicQueryStringUtils,
  Crypto,
  QueryStringUtils,
  StringMap,
  StorageBackend,
  LocationLike,
  AppAuthError,
} from '@openid/appauth';
import * as WebBrowser from 'expo-web-browser';
import qs from 'qs';
import { Platform } from 'react-native';
import { ExpoStorageBackend } from './ExpoStorage';
import { ExpoAuthorizationServiceConfiguration } from './ExpoAuthorizationServiceConfiguration';
import { ExpoCrypto } from './ExpoCrypto';

/**
 * key for authorization request.
 */
const authorizationRequestKey = (handle: string) => {
  return `${handle}_expo_appauth_authorization_request`;
};

/**
 * key for authorization service configuration
 */
const authorizationServiceConfigurationKey = (handle: string) => {
  return `${handle}_expo_appauth_authorization_service_configuration`;
};

/**
 * key in local storage which represents the current authorization request.
 */
const AUTHORIZATION_REQUEST_HANDLE_KEY = 'expo_appauth_current_authorization_request';

export class ExpoRequestHandler extends AuthorizationRequestHandler {
  static getQueryParams = (url: string): Record<string, string> => {
    let parts = url.split('#');
    let hash = parts[1];
    let partsWithoutHash = parts[0].split('?');
    let queryString = partsWithoutHash[partsWithoutHash.length - 1];

    // Get query string (?hello=world)
    let parsedSearch = qs.parse(queryString);

    // TODO(Bacon): Should we support errorCode like expo-auth-session?
    // Pull errorCode off of params
    // let { errorCode } = parsedSearch;
    // delete parsedSearch.errorCode;

    // Get hash (#abc=example)
    let parsedHash = {};
    if (parts[1]) {
      parsedHash = qs.parse(hash);
    }

    // Merge search and hash
    let params = {
      ...parsedSearch,
      ...parsedHash,
    };

    return params;
  };

  private error: AuthorizationError | null = null;
  private request: AuthorizationRequest | null = null;
  private authPromise?: Promise<any>;
  private url?: string;

  constructor(
    public locationLike: LocationLike = window.location,
    public storageBackend: StorageBackend = new ExpoStorageBackend(),
    utils: QueryStringUtils = new BasicQueryStringUtils(),
    // @ts-ignore
    crypto: Crypto = new ExpoCrypto()
  ) {
    super(utils, crypto);
  }

  performAuthorizationRequest(
    configuration: any | ExpoAuthorizationServiceConfiguration,
    request: AuthorizationRequest
  ): void {
    this.request = request;

    this.authPromise = new Promise((resolve, reject) => {
      // Calling toJson() adds in the code & challenge when possible
      request
        .toJson()
        .then(async requestJson => {
          if (this.request) this.request.state = requestJson.state!;

          const handle = await this.crypto.generateRandom(10);

          // before you make request, persist all request related data in local storage.
          await Promise.all([
            this.storageBackend.setItem(AUTHORIZATION_REQUEST_HANDLE_KEY, handle),

            this.storageBackend.setItem(
              authorizationRequestKey(handle),
              JSON.stringify(requestJson)
            ),
            this.storageBackend.setItem(
              authorizationServiceConfigurationKey(handle),
              JSON.stringify(configuration.toJson())
            ),
          ]);

          let url = this.buildRequestUrl(configuration, request);

          console.log('Making a request to ', request, url);
          const payload = await Platform.select<any>({
            web: async () => {
              window.location.href = url;
              // TODO(Bacon): Support mini-window
              // const width = 880;
              // const height = 380;
              // const popup = window.open(
              //   url,
              //   'Authenticate',
              //   `width=${width}, height=${height}, modal=no, resizable=no, toolbar=no, menubar=no, scrollbars=no, alwaysRaise=yes`
              // );
              // if (popup) popup.resizeBy(0, 50);
            },
            default: () => WebBrowser.openAuthSessionAsync(url, request.redirectUri),
          })();
          if (Platform.OS === 'web') {
            resolve();
            return;
          }

          if (payload.type === 'success') {
            this.url = payload.url;
            resolve();
          } else {
            // TODO(Bacon): Throw some kind of error for dismiss / cancel.
            const error = new AppAuthError(`Authorization flow was cancelled.`, {
              // -3 is the iOS code for user dismissed.
              code: -3,
              // @ts-ignore: message is not on the type
              message: payload.message,
              type: payload.type,
            });
            reject(error);
          }
        })
        .catch(reject);
    });
  }

  private getQueryParams(): StringMap {
    if (Platform.OS === 'web') {
      return this.utils.parse(this.locationLike, false /* don't use hash */);
    }
    if (!this.url) throw new Error('Auth did not complete properly');
    return ExpoRequestHandler.getQueryParams(this.url!);
  }

  async completeAuthorizationRequestWithRequestAsync(
    handle: string,
    request: AuthorizationRequest
  ): Promise<AuthorizationRequestResponse | null> {
    let queryParams = this.getQueryParams();
    let state: string | undefined = queryParams['state'];
    let code: string | undefined = queryParams['code'];
    let error: string | undefined = queryParams['error'];
    // let error: string | undefined = queryParams['error'] ?? queryParams['errorCode'];
    console.log('Potential authorization request ', queryParams, state, code, error);
    let shouldNotify = state === request.state;
    let authorizationResponse: AuthorizationResponse | null = null;
    let authorizationError: AuthorizationError | null = null;

    if (!shouldNotify) {
      console.log('Mismatched request (state and request_uri) dont match.');
      return null;
    }

    if (error) {
      // get additional optional info.
      let errorUri = queryParams['error_uri'];
      let errorDescription = queryParams['error_description'];
      authorizationError = new AuthorizationError({
        error,
        error_description: errorDescription,
        error_uri: errorUri,
        state,
      });
    } else {
      authorizationResponse = new AuthorizationResponse({ code, state });
    }

    // cleanup state
    await Promise.all([
      this.storageBackend.removeItem(AUTHORIZATION_REQUEST_HANDLE_KEY),
      this.storageBackend.removeItem(authorizationRequestKey(handle)),
      this.storageBackend.removeItem(authorizationServiceConfigurationKey(handle)),
    ]);

    console.log('Delivering authorization response');
    return {
      request,
      response: authorizationResponse,
      error: authorizationError,
    } as AuthorizationRequestResponse;
  }

  async getOrRehydrateRequestAsync(): Promise<AuthorizationRequest | null> {
    if (this.request) return this.request;
    const handle = await this.storageBackend.getItem(AUTHORIZATION_REQUEST_HANDLE_KEY);
    if (!handle) return null;
    // we have a pending request.
    // fetch authorization request, and check state
    const request = await this.storageBackend
      .getItem(authorizationRequestKey(handle))
      // requires a corresponding instance of result
      .then(result => JSON.parse(result!))
      .then(json => new AuthorizationRequest(json));
    this.request = request;
    return request;
  }

  /**
   * Attempts to introspect the contents of storage backend and completes the
   * request.
   */
  protected async completeAuthorizationRequest(): Promise<AuthorizationRequestResponse | null> {
    if (this.authPromise) await this.authPromise;
    const handle = await this.storageBackend.getItem(AUTHORIZATION_REQUEST_HANDLE_KEY);
    if (!handle) return null;
    // we have a pending request.
    // fetch authorization request, and check state
    const request = await this.getOrRehydrateRequestAsync();
    if (!request) throw new Error('Cannot complete an auth that has not begun');

    if (Platform.OS !== 'web') {
      if (!this.url) throw new Error('Auth did not complete properly');
      if (this.error) {
        const error = this.error;
        this.error = null;
        return {
          request,
          response: null,
          error,
        } as AuthorizationRequestResponse;
      }
    }

    return await this.completeAuthorizationRequestWithRequestAsync(handle, request);
  }
}
