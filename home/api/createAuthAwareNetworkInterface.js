/* @flow */

import ConnectivityAwareHTTPNetworkInterface from './ConnectivityAwareHTTPNetworkInterface';

type AuthAwareNetworkInterfaceOptions = {
  uri: string,
  getSessionSecret: () => ?string,
  setSession: (session: { [string]: any }) => void,
  signOutAsync: () => Promise<void>,
};

class AuthAwareNetworkInterface {
  _requestQueue = [];
  _networkInterface: ConnectivityAwareHTTPNetworkInterface;
  _getSessionSecret: () => ?string;
  _setSession: (session: { [string]: any }) => void;
  _signOutAsync: () => void;

  __debug_hasCompletedRefresh: any;

  constructor(options: AuthAwareNetworkInterfaceOptions) {
    let {
      uri,
      getSessionSecret,
      setSession,
      signOutAsync,
      ...connectivityInterfaceOptions
    } = options;

    this._networkInterface = new ConnectivityAwareHTTPNetworkInterface(
      uri,
      connectivityInterfaceOptions
    );
    this._getSessionSecret = getSessionSecret;
    this._setSession = setSession;
    this._signOutAsync = signOutAsync;

    this._applyAuthorizationHeaderMiddleware();
  }

  _applyAuthorizationHeaderMiddleware = () => {
    this._networkInterface.use([
      {
        applyMiddleware: (req, next) => {
          if (!req.options.headers) {
            req.options.headers = {};
          }

          const sessionSecret = this._getSessionSecret();
          if (sessionSecret) {
            req.options.headers['Expo-Session'] = sessionSecret;
          }

          next();
        },
      },
    ]);
  };

  query(request: any) {
    return this._networkInterface.query(request);
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
