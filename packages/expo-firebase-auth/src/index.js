/**
 * @flow
 * Auth representation wrapper
 */
import { Platform } from 'expo-core';
import { SharedEventEmitter, INTERNALS, ModuleBase, utils } from 'expo-firebase-app';

import type { App } from 'expo-firebase-app';
import ConfirmationResult from './phone/ConfirmationResult';
import PhoneAuthListener from './phone/PhoneAuthListener';
import EmailAuthProvider from './providers/EmailAuthProvider';
import FacebookAuthProvider from './providers/FacebookAuthProvider';
import GithubAuthProvider from './providers/GithubAuthProvider';
import GoogleAuthProvider from './providers/GoogleAuthProvider';
import OAuthProvider from './providers/OAuthProvider';
import PhoneAuthProvider from './providers/PhoneAuthProvider';
import TwitterAuthProvider from './providers/TwitterAuthProvider';
import User from './User';
import AuthSettings from './AuthSettings';

// providers
import type {
  ActionCodeInfo,
  ActionCodeSettings,
  AuthCredential,
  NativeUser,
  NativeUserCredential,
  UserCredential,
} from './types';

const isAndroid = Platform.OS === 'android';

const { isBoolean } = utils;

type AuthState = {
  user?: NativeUser,
};

const NATIVE_EVENTS = {
  authStateChanged: 'Expo.Firebase.auth_state_changed',
  authIdTokenChanged: 'Expo.Firebase.auth_id_token_changed',
  phoneAuthStateChanged: 'Expo.Firebase.phone_auth_state_changed',
};

export const MODULE_NAME = 'ExpoFirebaseAuth';
export const NAMESPACE = 'auth';
export const statics = {
  EmailAuthProvider,
  PhoneAuthProvider,
  GoogleAuthProvider,
  GithubAuthProvider,
  TwitterAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  PhoneAuthState: {
    CODE_SENT: 'sent',
    AUTO_VERIFY_TIMEOUT: 'timeout',
    AUTO_VERIFIED: 'verified',
    ERROR: 'error',
  },
};
export default class Auth extends ModuleBase {
  static namespace = 'auth';
  static moduleName = 'ExpoFirebaseAuth';
  static statics = statics;

  _authResult: boolean;
  _languageCode: string;
  _user: User | null;

  constructor(app: App) {
    super(app, {
      statics,
      events: Object.values(NATIVE_EVENTS),
      moduleName: MODULE_NAME,
      hasMultiAppSupport: true,
      hasCustomUrlSupport: false,
      namespace: NAMESPACE,
    });
    this._user = null;
    this._authResult = false;
    this._languageCode =
      this.nativeModule.APP_LANGUAGE[app._name] || this.nativeModule.APP_LANGUAGE['[DEFAULT]'];

    SharedEventEmitter.addListener(
      // sub to internal native event - this fans out to
      // public event name: onAuthStateChanged
      this.getAppEventName(NATIVE_EVENTS.authStateChanged),
      (state: AuthState) => {
        this._setUser(state.user);
        SharedEventEmitter.emit(this.getAppEventName('onAuthStateChanged'), this._user);
      }
    );

    SharedEventEmitter.addListener(
      // sub to internal native event - this fans out to
      // public events based on event.type
      this.getAppEventName(NATIVE_EVENTS.phoneAuthStateChanged),
      (event: Object) => {
        const eventKey = `phone:auth:${event.requestKey}:${event.type}`;
        SharedEventEmitter.emit(eventKey, event.state);
      }
    );

    SharedEventEmitter.addListener(
      // sub to internal native event - this fans out to
      // public event name: onIdTokenChanged
      this.getAppEventName(NATIVE_EVENTS.authIdTokenChanged),
      (auth: AuthState) => {
        this._setUser(auth.user);
        SharedEventEmitter.emit(this.getAppEventName('onIdTokenChanged'), this._user);
      }
    );

    this.nativeModule.addAuthStateListener();
    this.nativeModule.addIdTokenListener();
  }

  _setUser(user: ?NativeUser): ?User {
    this._user = user ? new User(this, user) : null;
    this._authResult = true;
    SharedEventEmitter.emit(this.getAppEventName('onUserChanged'), this._user);
    return this._user;
  }

  _setUserCredential(userCredential: NativeUserCredential): UserCredential {
    const user = new User(this, userCredential.user);
    this._user = user;
    this._authResult = true;
    SharedEventEmitter.emit(this.getAppEventName('onUserChanged'), this._user);
    return {
      additionalUserInfo: userCredential.additionalUserInfo,
      user,
    };
  }

  /*
   * WEB API
   */

  /**
   * Listen for auth changes.
   * @param listener
   */
  onAuthStateChanged(listener: Function) {
    this.logger.info('Creating onAuthStateChanged listener');
    SharedEventEmitter.addListener(this.getAppEventName('onAuthStateChanged'), listener);
    if (this._authResult) listener(this._user || null);

    return () => {
      this.logger.info('Removing onAuthStateChanged listener');
      SharedEventEmitter.removeListener(this.getAppEventName('onAuthStateChanged'), listener);
    };
  }

  /**
   * Listen for id token changes.
   * @param listener
   */
  onIdTokenChanged(listener: Function) {
    this.logger.info('Creating onIdTokenChanged listener');
    SharedEventEmitter.addListener(this.getAppEventName('onIdTokenChanged'), listener);
    if (this._authResult) listener(this._user || null);

    return () => {
      this.logger.info('Removing onIdTokenChanged listener');
      SharedEventEmitter.removeListener(this.getAppEventName('onIdTokenChanged'), listener);
    };
  }

  /**
   * Listen for user changes.
   * @param listener
   */
  onUserChanged(listener: Function) {
    this.logger.info('Creating onUserChanged listener');
    SharedEventEmitter.addListener(this.getAppEventName('onUserChanged'), listener);
    if (this._authResult) listener(this._user || null);

    return () => {
      this.logger.info('Removing onUserChanged listener');
      SharedEventEmitter.removeListener(this.getAppEventName('onUserChanged'), listener);
    };
  }

  /**
   * Sign the current user out
   * @return {Promise}
   */
  signOut(): Promise<void> {
    return this.nativeModule.signOut().then(() => {
      this._setUser();
    });
  }

  /**
   * Sign a user in anonymously
   *
   * @return {Promise} A promise resolved upon completion
   */
  signInAnonymously(): Promise<UserCredential> {
    return this.nativeModule
      .signInAnonymously()
      .then(userCredential => this._setUserCredential(userCredential));
  }

  /**
   * Sign a user in anonymously
   *
   * @deprecated Deprecated signInAnonymouslyAndRetrieveData in favor of signInAnonymously.
   * @return {Promise} A promise resolved upon completion
   */
  signInAnonymouslyAndRetrieveData(): Promise<UserCredential> {
    console.warn('Deprecated signInAnonymouslyAndRetrieveData in favor of signInAnonymously.');
    return this.nativeModule
      .signInAnonymously()
      .then(userCredential => this._setUserCredential(userCredential));
  }

  /**
   * Create a user with the email/password functionality
   *
   * @param  {string} email    The user's email
   * @param  {string} password The user's password
   * @return {Promise}         A promise indicating the completion
   */
  createUserWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
    return this.nativeModule
      .createUserWithEmailAndPassword(email, password)
      .then(userCredential => this._setUserCredential(userCredential));
  }

  /**
   * Create a user with the email/password functionality
   *
   * @deprecated Deprecated createUserAndRetrieveDataWithEmailAndPassword in favor of createUserWithEmailAndPassword.
   * @param  {string} email    The user's email
   * @param  {string} password The user's password
   * @return {Promise}         A promise indicating the completion
   */
  createUserAndRetrieveDataWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<UserCredential> {
    console.warn(
      'Deprecated createUserAndRetrieveDataWithEmailAndPassword in favor of createUserWithEmailAndPassword.'
    );
    return this.nativeModule
      .createUserWithEmailAndPassword(email, password)
      .then(userCredential => this._setUserCredential(userCredential));
  }

  /**
   * Sign a user in with email/password
   *
   * @param  {string} email    The user's email
   * @param  {string} password The user's password
   * @return {Promise}         A promise that is resolved upon completion
   */
  signInWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
    return this.nativeModule
      .signInWithEmailAndPassword(email, password)
      .then(userCredential => this._setUserCredential(userCredential));
  }

  /**
   * Sign a user in with email/password
   *
   * @deprecated Deprecated signInAndRetrieveDataWithEmailAndPassword in favor of signInWithEmailAndPassword
   * @param  {string} email    The user's email
   * @param  {string} password The user's password
   * @return {Promise}         A promise that is resolved upon completion
   */
  signInAndRetrieveDataWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<UserCredential> {
    console.warn(
      'Deprecated signInAndRetrieveDataWithEmailAndPassword in favor of signInWithEmailAndPassword.'
    );
    return this.nativeModule
      .signInWithEmailAndPassword(email, password)
      .then(userCredential => this._setUserCredential(userCredential));
  }

  /**
   * Sign the user in with a custom auth token
   *
   * @param  {string} customToken  A self-signed custom auth token.
   * @return {Promise}             A promise resolved upon completion
   */
  signInWithCustomToken(customToken: string): Promise<UserCredential> {
    return this.nativeModule
      .signInWithCustomToken(customToken)
      .then(userCredential => this._setUserCredential(userCredential));
  }

  /**
   * Sign the user in with a custom auth token
   *
   * @deprecated Deprecated signInAndRetrieveDataWithCustomToken in favor of signInWithCustomToken
   * @param  {string} customToken  A self-signed custom auth token.
   * @return {Promise}             A promise resolved upon completion
   */
  signInAndRetrieveDataWithCustomToken(customToken: string): Promise<UserCredential> {
    console.warn(
      'Deprecated signInAndRetrieveDataWithCustomToken in favor of signInWithCustomToken.'
    );
    return this.nativeModule
      .signInWithCustomToken(customToken)
      .then(userCredential => this._setUserCredential(userCredential));
  }

  /**
   * Sign the user in with a third-party authentication provider
   *
   * @return {Promise}           A promise resolved upon completion
   */
  signInWithCredential(credential: AuthCredential): Promise<UserCredential> {
    return this.nativeModule
      .signInWithCredential(credential.providerId, credential.token, credential.secret)
      .then(userCredential => this._setUserCredential(userCredential));
  }

  /**
   * Sign the user in with a third-party authentication provider
   *
   * @deprecated Deprecated signInAndRetrieveDataWithCredential in favor of signInWithCredential.
   * @return {Promise}           A promise resolved upon completion
   */
  signInAndRetrieveDataWithCredential(credential: AuthCredential): Promise<UserCredential> {
    console.warn(
      'Deprecated signInAndRetrieveDataWithCredential in favor of signInWithCredential.'
    );
    return this.nativeModule
      .signInWithCredential(credential.providerId, credential.token, credential.secret)
      .then(userCredential => this._setUserCredential(userCredential));
  }

  /**
   * Asynchronously signs in using a phone number.
   *
   */
  signInWithPhoneNumber(phoneNumber: string, forceResend?: boolean): Promise<ConfirmationResult> {
    if (isAndroid) {
      return this.nativeModule
        .signInWithPhoneNumber(phoneNumber, forceResend || false)
        .then(result => new ConfirmationResult(this, result.verificationId));
    }

    return this.nativeModule
      .signInWithPhoneNumber(phoneNumber)
      .then(result => new ConfirmationResult(this, result.verificationId));
  }

  /**
   * Returns a PhoneAuthListener to listen to phone verification events,
   * on the final completion event a PhoneAuthCredential can be generated for
   * authentication purposes.
   *
   * @param phoneNumber
   * @param autoVerifyTimeoutOrForceResend Android Only
   * @param forceResend Android Only
   * @returns {PhoneAuthListener}
   */
  verifyPhoneNumber(
    phoneNumber: string,
    autoVerifyTimeoutOrForceResend?: number | boolean,
    forceResend?: boolean
  ): PhoneAuthListener {
    let _forceResend = forceResend;
    let _autoVerifyTimeout = 60;

    if (isBoolean(autoVerifyTimeoutOrForceResend)) {
      _forceResend = autoVerifyTimeoutOrForceResend;
    } else {
      _autoVerifyTimeout = autoVerifyTimeoutOrForceResend;
    }

    return new PhoneAuthListener(this, phoneNumber, _autoVerifyTimeout, _forceResend);
  }

  /**
   * Send reset password instructions via email
   * @param {string} email The email to send password reset instructions
   * @param actionCodeSettings
   */
  sendPasswordResetEmail(email: string, actionCodeSettings?: ActionCodeSettings): Promise<void> {
    return this.nativeModule.sendPasswordResetEmail(email, actionCodeSettings);
  }

  /**
   * Sends a sign-in email link to the user with the specified email
   * @param {string} email The email account to sign in with.
   * @param actionCodeSettings
   */
  sendSignInLinkToEmail(email: string, actionCodeSettings?: ActionCodeSettings): Promise<void> {
    return this.nativeModule.sendSignInLinkToEmail(email, actionCodeSettings);
  }

  /**
   * Checks if an incoming link is a sign-in with email link.
   * @param {string} emailLink Sign-in email link.
   */
  isSignInWithEmailLink(emailLink: string): boolean {
    return (
      typeof emailLink === 'string' &&
      (emailLink.includes('mode=signIn') || emailLink.includes('mode%3DsignIn')) &&
      (emailLink.includes('oobCode=') || emailLink.includes('oobCode%3D'))
    );
  }

  /**
   * Asynchronously signs in using an email and sign-in email link.
   *
   * @param {string} email The email account to sign in with.
   * @param {string} emailLink Sign-in email link.
   * @return {Promise} A promise resolved upon completion
   */
  signInWithEmailLink(email: string, emailLink: string): Promise<UserCredential> {
    return this.nativeModule
      .signInWithEmailLink(email, emailLink)
      .then(userCredential => this._setUserCredential(userCredential));
  }

  /**
   * Completes the password reset process, given a confirmation code and new password.
   *
   * @link https://firebase.google.com/docs/reference/js/firebase.auth.Auth#confirmPasswordReset
   * @param code
   * @param newPassword
   * @return {Promise.<Null>}
   */
  confirmPasswordReset(code: string, newPassword: string): Promise<void> {
    return this.nativeModule.confirmPasswordReset(code, newPassword);
  }

  /**
   * Applies a verification code sent to the user by email or other out-of-band mechanism.
   *
   * @link https://firebase.google.com/docs/reference/js/firebase.auth.Auth#applyActionCode
   * @param code
   * @return {Promise.<Null>}
   */
  applyActionCode(code: string): Promise<void> {
    return this.nativeModule.applyActionCode(code);
  }

  /**
   * Checks a verification code sent to the user by email or other out-of-band mechanism.
   *
   * @link https://firebase.google.com/docs/reference/js/firebase.auth.Auth#checkActionCode
   * @param code
   * @return {Promise.<any>|Promise<ActionCodeInfo>}
   */
  checkActionCode(code: string): Promise<ActionCodeInfo> {
    return this.nativeModule.checkActionCode(code);
  }

  /**
   * Returns a list of authentication methods that can be used to sign in a given user (identified by its main email address).
   * @return {Promise}
   */
  fetchSignInMethodsForEmail(email: string): Promise<string[]> {
    return this.nativeModule.fetchSignInMethodsForEmail(email);
  }

  verifyPasswordResetCode(code: string): Promise<string> {
    return this.nativeModule.verifyPasswordResetCode(code);
  }

  /**
   * Sets the language for the auth module.
   *
   * @param code
   */
  set languageCode(code: string) {
    this._languageCode = code;
    this.nativeModule.setLanguageCode(code);
  }

  /**
   * The language for the auth module.
   *
   * @return {string}
   */
  get languageCode(): string {
    return this._languageCode;
  }

  /**
   * The current Auth instance's settings. This is used to edit/read configuration
   * related options like app verification mode for phone authentication.
   *
   * @return {AuthSettings}
   */
  get settings(): AuthSettings {
    if (!this._settings) {
      // lazy initialize
      this._settings = new AuthSettings(this);
    }
    return this._settings;
  }

  /**
   * Get the currently signed in user
   * @return {Promise}
   */
  get currentUser(): User | null {
    return this._user;
  }

  /**
   * KNOWN UNSUPPORTED METHODS
   */

  getRedirectResult() {
    throw new Error(INTERNALS.STRINGS.ERROR_UNSUPPORTED_MODULE_METHOD('auth', 'getRedirectResult'));
  }

  setPersistence() {
    throw new Error(INTERNALS.STRINGS.ERROR_UNSUPPORTED_MODULE_METHOD('auth', 'setPersistence'));
  }

  signInWithPopup() {
    throw new Error(INTERNALS.STRINGS.ERROR_UNSUPPORTED_MODULE_METHOD('auth', 'signInWithPopup'));
  }

  signInWithRedirect() {
    throw new Error(
      INTERNALS.STRINGS.ERROR_UNSUPPORTED_MODULE_METHOD('auth', 'signInWithRedirect')
    );
  }

  // firebase issue - https://github.com/invertase/react-native-firebase/pull/655#issuecomment-349904680
  useDeviceLanguage() {
    throw new Error(INTERNALS.STRINGS.ERROR_UNSUPPORTED_MODULE_METHOD('auth', 'useDeviceLanguage'));
  }
}

export { User, AuthSettings };
