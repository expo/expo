/* @flow */

import ConnectivityAwareHTTPNetworkInterface from './ConnectivityAwareHTTPNetworkInterface';

type AuthAwareNetworkInterfaceOptions = {
  uri: string,
  getIdToken: () => ?string,
  setIdToken: (idToken: string) => void,
  getRefreshToken: () => ?string,
  idTokenIsValid: () => boolean,
  refreshIdTokenAsync: () => Promise<string>,
  getSessionSecret: () => ?string,
  setSession: (session: { [string]: any }) => void,
  signOutAsync: () => Promise<void>,
  migrateAuth0ToSessionAsync: () => void,
};

class AuthAwareNetworkInterface {
  _requestQueue = [];
  _setIdToken: (token: string) => void;
  _getIdToken: () => ?string;
  _getRefreshToken: () => ?string;
  _refreshIdTokenAsync: () => Promise<string>;
  _idTokenIsValid: () => boolean;
  _networkInterface: ConnectivityAwareHTTPNetworkInterface;
  _getSessionSecret: () => ?string;
  _setSession: (session: { [string]: any }) => void;
  _signOutAsync: () => void;
  _migrateAuth0ToSessionAsync: () => void;

  __debug_hasCompletedRefresh: any;

  constructor(options: AuthAwareNetworkInterfaceOptions) {
    let {
      uri,
      getIdToken,
      setIdToken,
      getRefreshToken,
      idTokenIsValid,
      refreshIdTokenAsync,
      getSessionSecret,
      setSession,
      signOutAsync,
      migrateAuth0ToSessionAsync,
      ...connectivityInterfaceOptions
    } = options;

    this._networkInterface = new ConnectivityAwareHTTPNetworkInterface(
      uri,
      connectivityInterfaceOptions
    );
    this._getIdToken = getIdToken;
    this._setIdToken = setIdToken;
    this._getRefreshToken = getRefreshToken;
    this._idTokenIsValid = idTokenIsValid;
    this._refreshIdTokenAsync = refreshIdTokenAsync;
    this._getSessionSecret = getSessionSecret;
    this._setSession = setSession;
    this._signOutAsync = signOutAsync;
    this._migrateAuth0ToSessionAsync = migrateAuth0ToSessionAsync;

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

          const idToken = this._getIdToken();
          if (idToken) {
            req.options.headers['Authorization'] = `Bearer ${idToken}`;
          }

          next();
        },
      },
    ]);
  };

  query(request: any) {
    // Use a session if we have it
    if (this._getSessionSecret()) {
      return this._networkInterface.query(request);
    }

    // We dont have a session, but we have a valid idToken
    if (this._idTokenIsValid()) {
      // try migrating, but dont wait for the call back
      // this should never throw an error
      this._migrateAuth0ToSessionAsync();

      return this._networkInterface.query(request);
    }

    // We dont have a session or a valid idToken
    // If Auth0 has already shut down, we must log out and start again
    const dateAuth0Gone = new Date(2018, 1, 2); // April 1, 2018 - the months are 0 indexed
    if (Date.now() > dateAuth0Gone) {
      return new Promise(async (resolve, reject) => {
        await this._signOutAsync({ shouldResetApolloStore: false });
        alert('Your session has expired, logging out. Please sign in again.');
        resolve({
          data: { error: 'Your session has expired, logging out. Please sign in again.' },
        });
      });
    }

    // We dont have a session or a valid idToken
    // Auth0 hasnt shut down yet, so we ask them for a valid token
    return new Promise(async (resolve, reject) => {
      // Throw it into the queue
      this._requestQueue.push(() => {
        this._networkInterface
          .query(request)
          .then(resolve)
          .catch(reject);
      });

      if (this._requestQueue.length === 1) {
        let newIdToken = await this._refreshIdTokenAsync();
        this._setIdToken(newIdToken);
        this._flushRequestQueue();
      }
    });
  }

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
