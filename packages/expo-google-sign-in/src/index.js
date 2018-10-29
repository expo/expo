// @flow
import { NativeModulesProxy } from 'expo-core';

const { ExpoGoogleSignIn } = NativeModulesProxy;

export const { ERRORS, SCOPES, TYPES } = ExpoGoogleSignIn;

export type GoogleSignInType = TYPES.DEFAULT | TYPES.GAMES;

export type GoogleSignInOptions = {
  scopes: ?Array<string>,
  webClientId: ?string,
  hostedDomain: ?string,
  accountName: ?string,

  // Android
  signInType: ?SignInType,
  isOfflineEnabled: ?boolean,
  isPromptEnabled: ?boolean,
  // iOS
  clientId: ?string,
  language: ?string,
  openIdRealm: ?string,
};
class AuthData {
  constructor() {
    this.equals = this.equals.bind(this);
    this.toJSON = this.toJSON.bind(this);
  }

  equals(other: ?any): boolean {
    if (!other || !(other instanceof AuthData)) return false;
    return true;
  }

  toJSON() {
    return {};
  }
}
class Identity extends AuthData {
  uid: string;
  email: string;
  displayName: ?string;
  photoURL: ?string;
  firstName: ?string;
  lastName: ?string;

  constructor(props) {
    super(props);
    const { uid, email, displayName, photoURL, firstName, lastName } = props;

    this.uid = uid;
    this.email = email;
    this.displayName = displayName;
    this.photoURL = photoURL;
    this.firstName = firstName;
    this.lastName = lastName;
  }

  equals(other: ?any): boolean {
    if (!super.equals(other) || !(other instanceof Identity)) return false;

    return (
      this.displayName === other.displayName &&
      this.photoURL === other.photoURL &&
      this.uid === other.uid &&
      this.email === other.email &&
      this.firstName === other.firstName &&
      this.lastName === other.lastName
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      uid: this.uid,
      email: this.email,
      displayName: this.displayName,
      photoURL: this.photoURL,
      firstName: this.firstName,
      lastName: this.lastName,
    };
  }
}
class Authentication extends AuthData {
  clientId: ?string;
  accessToken: ?string;
  accessTokenExpirationDate: ?number;
  refreshToken: ?string;
  idToken: ?string;
  idTokenExpirationDate: ?number;

  constructor(props) {
    super(props);
    const {
      clientId,
      accessToken,
      accessTokenExpirationDate,
      refreshToken,
      idToken,
      idTokenExpirationDate,
    } = props;
    this.clientId = clientId;
    this.accessToken = accessToken;
    this.accessTokenExpirationDate = accessTokenExpirationDate;
    this.refreshToken = refreshToken;
    this.idToken = idToken;
    this.idTokenExpirationDate = idTokenExpirationDate;
  }

  equals(other: ?any): boolean {
    if (!super.equals(other) || !(other instanceof Authentication)) {
      return false;
    }
    return (
      this.clientId === other.clientId &&
      this.accessToken === other.accessToken &&
      this.accessTokenExpirationDate === other.accessTokenExpirationDate &&
      this.refreshToken === other.refreshToken &&
      this.idToken === other.idToken &&
      this.idTokenExpirationDate === other.idTokenExpirationDate
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      clientId: this.clientId,
      accessToken: this.accessToken,
      accessTokenExpirationDate: this.accessTokenExpirationDate,
      refreshToken: this.refreshToken,
      idToken: this.idToken,
      idTokenExpirationDate: this.idTokenExpirationDate,
    };
  }
}
class User extends Identity {
  auth: ?Authentication;
  scopes: Array<string>;
  hostedDomain: ?string;
  serverAuthCode: ?string;

  constructor(props) {
    super(props);
    const { auth, scopes, hostedDomain, serverAuthCode } = props;

    this.auth = auth;
    this.scopes = scopes;
    this.hostedDomain = hostedDomain;
    this.serverAuthCode = serverAuthCode;
  }

  clearCache = async () => {
    if (!ExpoGoogleSignIn.clearCacheAsync) {
      return;
    }
    if (!this.auth || !this.auth.accessToken) {
      throw new Error('GoogleSignIn: User.clearCache(): Invalid accessToken');
    }
    return ExpoGoogleSignIn.clearCacheAsync({ token: this.auth.accessToken });
  };

  getHeaders = (): Promise<{ [string]: string }> => {
    if (!this.auth.accessToken || this.auth.accessToken === '') {
      throw new Error('GoogleSignIn: User.getHeaders(): Invalid accessToken');
    }
    return {
      Authorization: `Bearer ${this.auth.accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
  };

  refreshAuthentication = async (): Promise<?Authentication> => {
    const response: {
      idToken: ?string,
      accessToken: ?string,
      auth: ?{ accessToken: ?string },
    } = await ExpoGoogleSignIn.getTokensAsync({
      email: this.email,
      scopes: this.scopes,
    });
    if (response.idToken == null) {
      response.idToken = this.auth.idToken;
    }
    if (!this.auth) {
      this.auth = new Authentication(response);
    } else {
      this.auth.idToken = response.idToken;
      this.auth.accessToken = response.accessToken;
    }

    return this.auth;
  };

  equals(other: ?any): boolean {
    if (!super.equals(other) || !(other instanceof User)) return false;

    return (
      this.auth.equals(other.auth) &&
      this.scopes === other.scopes &&
      this.hostedDomain === other.hostedDomain &&
      this.serverAuthCode === other.serverAuthCode
    );
  }

  toJSON() {
    let auth = this.auth;
    if (this.auth && this.auth.toJSON) {
      auth = this.auth.toJSON();
    }
    return {
      ...super.toJSON(),
      auth,
      scopes: this.scopes,
      hostedDomain: this.hostedDomain,
      serverAuthCode: this.serverAuthCode,
    };
  }
}

type GoogleSignInAuthResult = { type: 'success' | 'cancel', user: ?User };
class GoogleSignIn {
  _initialization: Promise;
  _currentUser: User;

  ERRORS = ERRORS;
  SCOPES = SCOPES;
  TYPES = TYPES;

  get currentUser(): User {
    return this._currentUser;
  }

  _setCurrentUser(currentUser: ?User): User {
    this._currentUser = currentUser;
    return this._currentUser;
  }

  _validateOptions = (options: ?GoogleSignInOptions): GoogleSignInOptions => {
    if (!options || !Object.keys(options).length) {
      throw new Error('GoogleSignIn: invalid configuration');
    }
    if (options.offlineAccess && !options.webClientId) {
      throw new Error('GoogleSignIn: offline use requires server web ClientID');
    }

    const DEFAULT_SCOPES = [SCOPES.PROFILE, SCOPES.EMAIL];
    return {
      ...options,
      scopes: options.scopes || DEFAULT_SCOPES,
    };
  };

  askForPlayServicesAsync = () => this.hasPlayServicesAsync({ showPlayServicesUpdateDialog: true });

  hasPlayServicesAsync = async (options = { showPlayServicesUpdateDialog: false }) => {
    if (ExpoGoogleSignIn.playServicesAvailableAsync) {
      if (options && options.showPlayServicesUpdateDialog === undefined) {
        throw new Error(
          'ExpoGoogleSignIn: Missing property `showPlayServicesUpdateDialog` in options object for `hasPlayServices`'
        );
      }
      return ExpoGoogleSignIn.playServicesAvailableAsync(options.showPlayServicesUpdateDialog);
    } else {
      return true;
    }
  };

  initAsync = async (options: ?GoogleSignInOptions): Promise<any> => {
    this.options = this._validateOptions(options || this.options);

    if (!this.options) {
      return false;
    }

    const hasPlayServices = await this.hasPlayServicesAsync();
    if (!hasPlayServices) {
      return false;
    }

    if (this._initialization == null) {
      try {
        this._initialization = ExpoGoogleSignIn.initAsync(this.options);
      } catch (e) {
        this._initialization = null;
      }
    }
    return this._initialization;
  };

  _invokeAuthMethod = async (method: string): Promise<?GoogleSignInAuthResult> => {
    await this.initAsync();
    const payload = await ExpoGoogleSignIn[method]();
    let account = payload != null ? new User(payload) : null;
    return this._setCurrentUser(account);
  };

  isSignedInAsync = async (): Promise<boolean> => {
    await this.initAsync();
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
