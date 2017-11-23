/* @flow */

import { Platform } from 'react-native';

import ConnectivityAwareHTTPNetworkInterface from './ConnectivityAwareHTTPNetworkInterface';

type AuthAwareNetworkInterfaceOptions = {
  uri: string,
  getIdToken: () => ?string,
  setIdToken: (idToken: string) => void,
  getRefreshToken: () => ?string,
  idTokenIsValid: () => boolean,
  refreshIdTokenAsync: () => Promise<string>,
};

// note(brentvatne): in dev we will always try to refresh our id token when we
// load the app, in order to surface any problems with our refresh token flow
let DEBUG_INVALIDATE_ID_TOKEN_ON_LOAD = __DEV__;

class AuthAwareNetworkInterface {
  _requestQueue = [];
  _setIdToken: (token: string) => void;
  _getIdToken: () => ?string;
  _getRefreshToken: () => ?string;
  _refreshIdTokenAsync: () => Promise<string>;
  _idTokenIsValid: () => boolean;
  _networkInterface: ConnectivityAwareHTTPNetworkInterface;

  __debug_hasCompletedRefresh: any;

  constructor(options: AuthAwareNetworkInterfaceOptions) {
    let {
      uri,
      getIdToken,
      setIdToken,
      getRefreshToken,
      idTokenIsValid,
      refreshIdTokenAsync,
      ...connectivityInterfaceOptions
    } = options;

    if (DEBUG_INVALIDATE_ID_TOKEN_ON_LOAD) {
      this.__debug_hasCompletedRefresh = false;
    }

    this._networkInterface = new ConnectivityAwareHTTPNetworkInterface(
      uri,
      connectivityInterfaceOptions
    );
    this._getIdToken = getIdToken;
    this._setIdToken = setIdToken;
    this._getRefreshToken = getRefreshToken;
    this._idTokenIsValid = idTokenIsValid;
    this._refreshIdTokenAsync = refreshIdTokenAsync;

    this._applyAuthorizationHeaderMiddleware();
    if (Platform.OS === 'android') {
      this._applyDisableGzipOnAndroidThanksgivingMiddleware();
    }
  }

  _applyAuthorizationHeaderMiddleware = () => {
    this._networkInterface.use([
      {
        applyMiddleware: (req, next) => {
          if (!req.options.headers) {
            req.options.headers = {};
          }

          const idToken = this._getIdToken();
          if (idToken) {
            req.options.headers['Authorization'] = `Bearer ${idToken}`;
          }

          next();
        },
      },
    ]);
  };

  // NOTE(2017-11-22): Remove this once we resolve encoding issues with www
  _applyDisableGzipOnAndroidThanksgivingMiddleware = () => {
    this._networkInterface.use([
      {
        applyMiddleware: (req, next) => {
          if (!req.options.headers) {
            req.options.headers = {};
          }

          req.options.headers['Accept-Encoding'] = `identity`;

          next();
        },
      },
    ]);
  };

  query(request: any) {
    if (this.__debug_shouldForceRefreshToken() && (this._idTokenIsValid() || !this._getIdToken())) {
      return this._networkInterface.query(request);
    } else {
      // Throw it into the queue
      return new Promise(async (resolve, reject) => {
        this._requestQueue.push(() => {
          this._networkInterface
            .query(request)
            .then(resolve)
            .catch(reject);
        });

        // If it's the first one thrown into the queue, refresh token
        if (this._requestQueue.length === 1) {
          let newIdToken = await this._refreshIdTokenAsync();
          this._setIdToken(newIdToken);
          this.__debug_doneForceRefreshToken();
          this._flushRequestQueue();
        }
      });
    }
  }

  __debug_shouldForceRefreshToken = () => {
    if (!DEBUG_INVALIDATE_ID_TOKEN_ON_LOAD) {
      return true;
    }

    return this.__debug_hasCompletedRefresh;
  };

  __debug_doneForceRefreshToken = () => {
    if (!DEBUG_INVALIDATE_ID_TOKEN_ON_LOAD) {
      return;
    }

    this.__debug_hasCompletedRefresh = true;
  };

  _flushRequestQueue() {
    this._requestQueue.forEach(queuedRequest => queuedRequest());
    this._requestQueue = [];
  }

  use(middleware: any) {
    return this._networkInterface.use(middleware);
  }

  useAfter(afterware: any) {
    return this._networkInterface.useAfter(afterware);
  }
}

export default function createAuthAwareNetworkInterface(options: AuthAwareNetworkInterfaceOptions) {
  return new AuthAwareNetworkInterface(options);
}
