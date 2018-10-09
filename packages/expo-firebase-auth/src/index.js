/**
 * @flow
 * Auth representation wrapper
 */

import User from './User';
import {
  internals as INTERNALS,
  registerModule,
  ModuleBase,
  getNativeModule,
  getLogger,
  utils,
  events,
} from 'expo-firebase-app';
import ConfirmationResult from './phone/ConfirmationResult';
import PhoneAuthListener from './phone/PhoneAuthListener';

// providers
import OAuthProvider from './providers/OAuthProvider';
import EmailAuthProvider from './providers/EmailAuthProvider';
import PhoneAuthProvider from './providers/PhoneAuthProvider';
import GoogleAuthProvider from './providers/GoogleAuthProvider';
import GithubAuthProvider from './providers/GithubAuthProvider';
import TwitterAuthProvider from './providers/TwitterAuthProvider';
import FacebookAuthProvider from './providers/FacebookAuthProvider';

import type {
  ActionCodeInfo,
  ActionCodeSettings,
  AuthCredential,
  NativeUser,
  NativeUserCredential,
  UserCredential,
} from './types';
import type { App } from 'expo-firebase-app';

const { isAndroid, isBoolean } = utils;
const { getAppEventName, SharedEventEmitter } = events;

type AuthState = {
  user?: NativeUser,
};

const NATIVE_EVENTS = ['auth_state_changed', 'auth_id_token_changed', 'phone_auth_state_changed'];

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
      events: NATIVE_EVENTS,
      moduleName: MODULE_NAME,
      multiApp: true,
      hasShards: false,
      namespace: NAMESPACE,
    });
    this._user = null;
    this._authResult = false;
    this._languageCode =
      getNativeModule(this).APP_LANGUAGE[app._name] ||
      getNativeModule(this).APP_LANGUAGE['[DEFAULT]'];

    SharedEventEmitter.addListener(
      // sub to internal native event - this fans out to
      // public event name: onAuthStateChanged
      getAppEventName(this, 'auth_state_changed'),
      (state: AuthState) => {
        this._setUser(state.user);
        SharedEventEmitter.emit(getAppEventName(this, 'onAuthStateChanged'), this._user);
      }
    );

    SharedEventEmitter.addListener(
      // sub to internal native event - this fans out to
      // public events based on event.type
      getAppEventName(this, 'phone_auth_state_changed'),
      (event: Object) => {
        const eventKey = `phone:auth:${event.requestKey}:${event.type}`;
        SharedEventEmitter.emit(eventKey, event.state);
      }
    );

    SharedEventEmitter.addListener(
      // sub to internal native event - this fans out to
      // public event name: onIdTokenChanged
      getAppEventName(this, 'auth_id_token_changed'),
      (auth: AuthState) => {
        this._setUser(auth.user);
        SharedEventEmitter.emit(getAppEventName(this, 'onIdTokenChanged'), this._user);
      }
    );

    getNativeModule(this).addAuthStateListener();
    getNativeModule(this).addIdTokenListener();
  }

  _setUser(user: ?NativeUser): ?User {
    this._user = user ? new User(this, user) : null;
    this._authResult = true;
    SharedEventEmitter.emit(getAppEventName(this, 'onUserChanged'), this._user);
    return this._user;
  }

  _setUserCredential(userCredential: NativeUserCredential): UserCredential {
    const user = new User(this, userCredential.user);
    this._user = user;
    this._authResult = true;
    SharedEventEmitter.emit(getAppEventName(this, 'onUserChanged'), this._user);
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
    getLogger(this).info('Creating onAuthStateChanged listener');
    SharedEventEmitter.addListener(getAppEventName(this, 'onAuthStateChanged'), listener);
    if (this._authResult) listener(this._user || null);

    return () => {
      getLogger(this).info('Removing onAuthStateChanged listener');
      SharedEventEmitter.removeListener(getAppEventName(this, 'onAuthStateChanged'), listener);
    };
  }

  /**
   * Listen for id token changes.
   * @param listener
   */
  onIdTokenChanged(listener: Function) {
    getLogger(this).info('Creating onIdTokenChanged listener');
    SharedEventEmitter.addListener(getAppEventName(this, 'onIdTokenChanged'), listener);
    if (this._authResult) listener(this._user || null);

    return () => {
      getLogger(this).info('Removing onIdTokenChanged listener');
      SharedEventEmitter.removeListener(getAppEventName(this, 'onIdTokenChanged'), listener);
    };
  }

  /**
   * Listen for user changes.
   * @param listener
   */
  onUserChanged(listener: Function) {
    getLogger(this).info('Creating onUserChanged listener');
    SharedEventEmitter.addListener(getAppEventName(this, 'onUserChanged'), listener);
    if (this._authResult) listener(this._user || null);

    return () => {
      getLogger(this).info('Removing onUserChanged listener');
      SharedEventEmitter.removeListener(getAppEventName(this, 'onUserChanged'), listener);
    };
  }

  /**
   * Sign the current user out
   * @return {Promise}
   */
  signOut(): Promise<void> {
    return getNativeModule(this)
      .signOut()
      .then(() => {
        this._setUser();
      });
  }

  /**
   * Sign a user in anonymously
   * @deprecated Deprecated signInAnonymously in favor of signInAnonymouslyAndRetrieveData.
   * @return {Promise} A promise resolved upon completion
   */
  signInAnonymously(): Promise<User> {
    console.warn(
      'Deprecated firebase.User.prototype.signInAnonymously in favor of firebase.User.prototype.signInAnonymouslyAndRetrieveData.'
    );
    return getNativeModule(this)
      .signInAnonymously()
      .then(user => this._setUser(user));
  }

  /**
   * Sign a user in anonymously
   * @return {Promise} A promise resolved upon completion
   */
  signInAnonymouslyAndRetrieveData(): Promise<UserCredential> {
    return getNativeModule(this)
      .signInAnonymouslyAndRetrieveData()
      .then(userCredential => this._setUserCredential(userCredential));
  }

  /**
   * Create a user with the email/password functionality
   * @deprecated Deprecated createUserWithEmailAndPassword in favor of createUserAndRetrieveDataWithEmailAndPassword.
   * @param  {string} email    The user's email
   * @param  {string} password The user's password
   * @return {Promise}         A promise indicating the completion
   */
  createUserWithEmailAndPassword(email: string, password: string): Promise<User> {
    console.warn(
      'Deprecated firebase.User.prototype.createUserWithEmailAndPassword in favor of firebase.User.prototype.createUserAndRetrieveDataWithEmailAndPassword.'
    );
    return getNativeModule(this)
      .createUserWithEmailAndPassword(email, password)
      .then(user => this._setUser(user));
  }

  /**
   * Create a user with the email/password functionality
   * @param  {string} email    The user's email
   * @param  {string} password The user's password
   * @return {Promise}         A promise indicating the completion
   */
  createUserAndRetrieveDataWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<UserCredential> {
    return getNativeModule(this)
      .createUserAndRetrieveDataWithEmailAndPassword(email, password)
      .then(userCredential => this._setUserCredential(userCredential));
  }

  /**
   * Sign a user in with email/password
   * @deprecated Deprecated signInWithEmailAndPassword in favor of signInAndRetrieveDataWithEmailAndPassword
   * @param  {string} email    The user's email
   * @param  {string} password The user's password
   * @return {Promise}         A promise that is resolved upon completion
   */
  signInWithEmailAndPassword(email: string, password: string): Promise<User> {
    console.warn(
      'Deprecated firebase.User.prototype.signInWithEmailAndPassword in favor of firebase.User.prototype.signInAndRetrieveDataWithEmailAndPassword.'
    );
    return getNativeModule(this)
      .signInWithEmailAndPassword(email, password)
      .then(user => this._setUser(user));
  }

  /**
   * Sign a user in with email/password
   * @param  {string} email    The user's email
   * @param  {string} password The user's password
   * @return {Promise}         A promise that is resolved upon completion
   */
  signInAndRetrieveDataWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<UserCredential> {
    return getNativeModule(this)
      .signInAndRetrieveDataWithEmailAndPassword(email, password)
      .then(userCredential => this._setUserCredential(userCredential));
  }

  /**
   * Sign the user in with a custom auth token
   * @deprecated Deprecated signInWithCustomToken in favor of signInAndRetrieveDataWithCustomToken
   * @param  {string} customToken  A self-signed custom auth token.
   * @return {Promise}             A promise resolved upon completion
   */
  signInWithCustomToken(customToken: string): Promise<User> {
    console.warn(
      'Deprecated firebase.User.prototype.signInWithCustomToken in favor of firebase.User.prototype.signInAndRetrieveDataWithCustomToken.'
    );
    return getNativeModule(this)
      .signInWithCustomToken(customToken)
      .then(user => this._setUser(user));
  }

  /**
   * Sign the user in with a custom auth token
   * @param  {string} customToken  A self-signed custom auth token.
   * @return {Promise}             A promise resolved upon completion
   */
  signInAndRetrieveDataWithCustomToken(customToken: string): Promise<UserCredential> {
    return getNativeModule(this)
      .signInAndRetrieveDataWithCustomToken(customToken)
      .then(userCredential => this._setUserCredential(userCredential));
  }

  /**
   * Sign the user in with a third-party authentication provider
   * @deprecated Deprecated signInWithCredential in favor of signInAndRetrieveDataWithCredential.
   * @return {Promise}           A promise resolved upon completion
   */
  signInWithCredential(credential: AuthCredential): Promise<User> {
    console.warn(
      'Deprecated firebase.User.prototype.signInWithCredential in favor of firebase.User.prototype.signInAndRetrieveDataWithCredential.'
    );
    return getNativeModule(this)
      .signInWithCredential(credential.providerId, credential.token, credential.secret)
      .then(user => this._setUser(user));
  }

  /**
   * Sign the user in with a third-party authentication provider
   * @return {Promise}           A promise resolved upon completion
   */
  signInAndRetrieveDataWithCredential(credential: AuthCredential): Promise<UserCredential> {
    return getNativeModule(this)
      .signInAndRetrieveDataWithCredential(
        credential.providerId,
        credential.token,
        credential.secret
      )
      .then(userCredential => this._setUserCredential(userCredential));
  }

  /**
   * Asynchronously signs in using a phone number.
   *
   */
  signInWithPhoneNumber(phoneNumber: string, forceResend?: boolean): Promise<ConfirmationResult> {
    if (isAndroid) {
      return getNativeModule(this)
        .signInWithPhoneNumber(phoneNumber, forceResend || false)
        .then(result => new ConfirmationResult(this, result.verificationId));
    }

    return getNativeModule(this)
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
    return getNativeModule(this).sendPasswordResetEmail(email, actionCodeSettings);
  }

  /**
   * Sends a sign-in email link to the user with the specified email
   * @param {string} email The email account to sign in with.
   * @param actionCodeSettings
   */
  sendSignInLinkToEmail(email: string, actionCodeSettings?: ActionCodeSettings): Promise<void> {
    return getNativeModule(this).sendSignInLinkToEmail(email, actionCodeSettings);
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
    return getNativeModule(this)
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
    return getNativeModule(this).confirmPasswordReset(code, newPassword);
  }

  /**
   * Applies a verification code sent to the user by email or other out-of-band mechanism.
   *
   * @link https://firebase.google.com/docs/reference/js/firebase.auth.Auth#applyActionCode
   * @param code
   * @return {Promise.<Null>}
   */
  applyActionCode(code: string): Promise<void> {
    return getNativeModule(this).applyActionCode(code);
  }

  /**
   * Checks a verification code sent to the user by email or other out-of-band mechanism.
   *
   * @link https://firebase.google.com/docs/reference/js/firebase.auth.Auth#checkActionCode
   * @param code
   * @return {Promise.<any>|Promise<ActionCodeInfo>}
   */
  checkActionCode(code: string): Promise<ActionCodeInfo> {
    return getNativeModule(this).checkActionCode(code);
  }

  /**
   * Returns a list of authentication providers that can be used to sign in a given user (identified by its main email address).
   * @return {Promise}
   * @Deprecated
   */
  fetchProvidersForEmail(email: string): Promise<string[]> {
    console.warn(
      'Deprecated firebase.auth().fetchProvidersForEmail in favor of firebase.auth().fetchSignInMethodsForEmail()'
    );
    return getNativeModule(this).fetchSignInMethodsForEmail(email);
  }

  /**
   * Returns a list of authentication methods that can be used to sign in a given user (identified by its main email address).
   * @return {Promise}
   */
  fetchSignInMethodsForEmail(email: string): Promise<string[]> {
    return getNativeModule(this).fetchSignInMethodsForEmail(email);
  }

  verifyPasswordResetCode(code: string): Promise<string> {
    return getNativeModule(this).verifyPasswordResetCode(code);
  }

  /**
   * Sets the language for the auth module
   * @param code
   * @returns {*}
   */
  set languageCode(code: string) {
    this._languageCode = code;
    getNativeModule(this).setLanguageCode(code);
  }

  /**
   * Get the currently signed in user
   * @return {Promise}
   */
  get currentUser(): User | null {
    return this._user;
  }

  get languageCode(): string {
    return this._languageCode;
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

registerModule(Auth);
