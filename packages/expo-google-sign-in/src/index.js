// @flow
import { NativeModulesProxy } from 'expo-core';

import User from './User';

const { ExpoGoogleSignIn } = NativeModulesProxy;

export const { ERRORS, SCOPES, TYPES } = ExpoGoogleSignIn;

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

  ERRORS = ERRORS;
  SCOPES = SCOPES;
  TYPES = TYPES;

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
    await this.initAsync();
    const payload = await ExpoGoogleSignIn[method]();
    let account = payload != null ? new User(payload) : null;
    return this._setCurrentUser(account);
  };

  askForPlayServicesAsync = (): Promise<boolean> => {
    return this.arePlayServicesAvailableAsync({ shouldUpdate: true });
  };

  arePlayServicesAvailableAsync = async (
    options: GoogleSignInPlayServicesOptions = { shouldUpdate: false }
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

    if (this._initialization == null) {
      this._initialization = ExpoGoogleSignIn.initAsync(this.options);
    }
    return this._initialization;
  };

  isSignedInAsync = async (): Promise<boolean> => {
    return ExpoGoogleSignIn.isSignedInAsync();
  };

  signInSilentlyAsync = (): Promise<?GoogleSignInAuthResult> =>
    this._invokeAuthMethod('signInSilentlyAsync');

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

  signOutAsync = (): Promise<?GoogleSignInAuthResult> => this._invokeAuthMethod('signOutAsync');

  disconnectAsync = (): Promise<?GoogleSignInAuthResult> =>
    this._invokeAuthMethod('disconnectAsync');

  getCurrentUserAsync = (): Promise<?GoogleSignInAuthResult> =>
    this._invokeAuthMethod('getCurrentUserAsync');

  getPhotoAsync = async (size: number = 128): Promise<?string> => {
    await this.initAsync();
    return ExpoGoogleSignIn.getPhotoAsync(size);
  };
}

export default new GoogleSignIn();

export { default as AuthData } from './AuthData';
export { default as Authentication } from './Authentication';
export { default as Identity } from './Identity';
export { default as User } from './User';
