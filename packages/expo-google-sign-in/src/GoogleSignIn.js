// @flow

import AuthData from './AuthData';
import Authentication from './Authentication';
import Identity from './Identity';
import User from './User';
import ExpoGoogleSignIn from './ExpoGoogleSignIn';

const { ERRORS, SCOPES, TYPES } = ExpoGoogleSignIn;

export type GoogleSignInType = 'default' | 'games';

export type GoogleSignInOptions = {
  scopes: ?Array<string>,
  webClientId: ?string,
  hostedDomain: ?string,
  accountName: ?string,

  // Android
  signInType: ?GoogleSignInType,
  isOfflineEnabled: ?boolean,
  isPromptEnabled: ?boolean,
  // iOS
  clientId: ?string,
  language: ?string,
  openIdRealm: ?string,
};

export type GoogleSignInAuthResultType = 'success' | 'cancel';

export type GoogleSignInAuthResult = {
  type: GoogleSignInAuthResultType,
  user: ?User,
};

export type GoogleSignInPlayServicesOptions = {
  shouldUpdate: boolean,
};

export class GoogleSignIn {
  _initialization: Promise;
  _currentUser: User;

  get ERRORS() {
    return ERRORS;
  }
  get SCOPES() {
    return SCOPES;
  }
  get TYPES() {
    return TYPES;
  }

  get AuthData() {
    return AuthData;
  }
  get Authentication() {
    return Authentication;
  }
  get Identity() {
    return Identity;
  }
  get User() {
    return User;
  }

  get currentUser(): ?User {
    return this._currentUser;
  }

  _setCurrentUser(currentUser: ?User): User {
    this._currentUser = currentUser;
    return this._currentUser;
  }

  _validateOptions = (options: ?GoogleSignInOptions): GoogleSignInOptions => {
    if (!options || !Object.keys(options).length) {
      throw new Error('GoogleSignIn: you must provide a meaningful configuration, empty provided');
    }
    if (options.offlineAccess && !options.webClientId) {
      throw new Error('GoogleSignIn: Offline access requires server `webClientId`');
    }

    const DEFAULT_SCOPES = [SCOPES.PROFILE, SCOPES.EMAIL];
    return {
      ...options,
      scopes: options.scopes || DEFAULT_SCOPES,
    };
  };

  _invokeAuthMethod = async (method: string): Promise<?GoogleSignInAuthResult> => {
    await this._ensureGoogleIsInitializedAsync();
    const payload = await ExpoGoogleSignIn[method]();
    let account = payload != null ? new User(payload) : null;
    return this._setCurrentUser(account);
  };

  askForPlayServicesAsync = (): Promise<boolean> => {
    return this.arePlayServicesAvailableAsync({ shouldUpdate: true });
  };

  arePlayServicesAvailableAsync = async (
    options?: GoogleSignInPlayServicesOptions = { shouldUpdate: false }
  ): Promise<boolean> => {
    if (ExpoGoogleSignIn.arePlayServicesAvailableAsync) {
      if (options && options.shouldUpdate === undefined) {
        throw new Error(
          'ExpoGoogleSignIn: Missing property `shouldUpdate` in options object for `shouldUpdate`'
        );
      }
      return ExpoGoogleSignIn.arePlayServicesAvailableAsync(options.shouldUpdate);
    } else {
      return true;
    }
  };

  initAsync = async (options: ?GoogleSignInOptions): Promise<any> => {
    this.options = this._validateOptions(options || this.options);

    const hasPlayServices = await this.arePlayServicesAvailableAsync();
    if (!hasPlayServices) {
      return false;
    }

    this._initialization = ExpoGoogleSignIn.initAsync(this.options);

    return this._initialization;
  };

  /*
  TODO: Bacon: Maybe we should throw an error: "attempting to ... before Google has been initialized"
  */
  _ensureGoogleIsInitializedAsync = async (options: ?GoogleSignInOptions): Promise<any> => {
    if (this._initialization == null) {
      return this.initAsync(options);
    }
    return this._initialization;
  };

  isSignedInAsync = async (): Promise<boolean> => {
    const user = await this.getCurrentUserAsync();
    return user != null;
  };

  isConnectedAsync = async (): Promise<boolean> => {
    return ExpoGoogleSignIn.isConnectedAsync();
  };

  signInSilentlyAsync = async (): Promise<?User> => {
    const isConnected = await this.isConnectedAsync();
    if (isConnected) {
      try {
        const auth = await this._invokeAuthMethod('signInSilentlyAsync');
        return auth;
      } catch (error) {
        // Android parity
        if (error.code === ERRORS.SIGN_IN_REQUIRED) {
          return null;
        }
        throw error;
      }
    }
    return null;
  };

  signInAsync = async (): Promise<?GoogleSignInAuthResult> => {
    try {
      const user = await this._invokeAuthMethod('signInAsync');
      return { type: 'success', user };
    } catch (error) {
      if (error.code === ERRORS.SIGN_IN_CANCELLED) {
        return { type: 'cancel', user: null };
      }
      throw error;
    }
  };

  signOutAsync = (): Promise => this._invokeAuthMethod('signOutAsync');

  disconnectAsync = (): Promise => this._invokeAuthMethod('disconnectAsync');

  getCurrentUserAsync = (): Promise<?User> => this._invokeAuthMethod('getCurrentUserAsync');

  getPhotoAsync = async (size: number = 128): Promise<?string> => {
    await this._ensureGoogleIsInitializedAsync();
    return ExpoGoogleSignIn.getPhotoAsync(size);
  };
}

export default new GoogleSignIn();
