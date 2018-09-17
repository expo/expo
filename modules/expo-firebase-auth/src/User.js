/**
 * @flow
 * User representation wrapper
 */
import { native, internals as INTERNALS } from 'expo-firebase-app';
const { getNativeModule } = native;

import type Auth from './';
import type {
  ActionCodeSettings,
  AuthCredential,
  NativeUser,
  UserCredential,
  UserInfo,
  UserMetadata,
} from './types';

type UpdateProfile = {
  displayName?: string,
  photoURL?: string,
};

export default class User {
  _auth: Auth;
  _user: NativeUser;

  /**
   *
   * @param auth Instance of Authentication class
   * @param user user result object from native
   */
  constructor(auth: Auth, user: NativeUser) {
    this._auth = auth;
    this._user = user;
  }

  /**
   * PROPERTIES
   */

  get displayName(): ?string {
    return this._user.displayName || null;
  }

  get email(): ?string {
    return this._user.email || null;
  }

  get emailVerified(): boolean {
    return this._user.emailVerified || false;
  }

  get isAnonymous(): boolean {
    return this._user.isAnonymous || false;
  }

  get metadata(): UserMetadata {
    return this._user.metadata;
  }

  get phoneNumber(): ?string {
    return this._user.phoneNumber || null;
  }

  get photoURL(): ?string {
    return this._user.photoURL || null;
  }

  get providerData(): Array<UserInfo> {
    return this._user.providerData;
  }

  get providerId(): string {
    return this._user.providerId;
  }

  get uid(): string {
    return this._user.uid;
  }

  /**
   * METHODS
   */

  /**
   * Delete the current user
   * @return {Promise}
   */
  delete(): Promise<void> {
    return getNativeModule(this._auth)
      .delete()
      .then(() => {
        this._auth._setUser();
      });
  }

  /**
   * get the token of current user
   * @return {Promise}
   */
  getIdToken(forceRefresh: boolean = false): Promise<string> {
    return getNativeModule(this._auth).getToken(forceRefresh);
  }

  /**
   * get the token of current user
   * @deprecated Deprecated getToken in favor of getIdToken.
   * @return {Promise}
   */
  getToken(forceRefresh: boolean = false): Promise<Object> {
    console.warn(
      'Deprecated firebase.User.prototype.getToken in favor of firebase.User.prototype.getIdToken.'
    );
    return getNativeModule(this._auth).getToken(forceRefresh);
  }

  /**
   * @deprecated Deprecated linkWithCredential in favor of linkAndRetrieveDataWithCredential.
   * @param credential
   */
  linkWithCredential(credential: AuthCredential): Promise<User> {
    console.warn(
      'Deprecated firebase.User.prototype.linkWithCredential in favor of firebase.User.prototype.linkAndRetrieveDataWithCredential.'
    );
    return getNativeModule(this._auth)
      .linkWithCredential(credential.providerId, credential.token, credential.secret)
      .then(user => this._auth._setUser(user));
  }

  /**
   *
   * @param credential
   */
  linkAndRetrieveDataWithCredential(credential: AuthCredential): Promise<UserCredential> {
    return getNativeModule(this._auth)
      .linkAndRetrieveDataWithCredential(credential.providerId, credential.token, credential.secret)
      .then(userCredential => this._auth._setUserCredential(userCredential));
  }

  /**
   * Re-authenticate a user with a third-party authentication provider
   * @return {Promise}         A promise resolved upon completion
   */
  reauthenticateWithCredential(credential: AuthCredential): Promise<void> {
    console.warn(
      'Deprecated firebase.User.prototype.reauthenticateWithCredential in favor of firebase.User.prototype.reauthenticateAndRetrieveDataWithCredential.'
    );
    return getNativeModule(this._auth)
      .reauthenticateWithCredential(credential.providerId, credential.token, credential.secret)
      .then(user => {
        this._auth._setUser(user);
      });
  }

  /**
   * Re-authenticate a user with a third-party authentication provider
   * @return {Promise}         A promise resolved upon completion
   */
  reauthenticateAndRetrieveDataWithCredential(credential: AuthCredential): Promise<UserCredential> {
    return getNativeModule(this._auth)
      .reauthenticateAndRetrieveDataWithCredential(
        credential.providerId,
        credential.token,
        credential.secret
      )
      .then(userCredential => this._auth._setUserCredential(userCredential));
  }

  /**
   * Reload the current user
   * @return {Promise}
   */
  reload(): Promise<void> {
    return getNativeModule(this._auth)
      .reload()
      .then(user => {
        this._auth._setUser(user);
      });
  }

  /**
   * Send verification email to current user.
   */
  sendEmailVerification(actionCodeSettings?: ActionCodeSettings): Promise<void> {
    return getNativeModule(this._auth)
      .sendEmailVerification(actionCodeSettings)
      .then(user => {
        this._auth._setUser(user);
      });
  }

  toJSON(): Object {
    return Object.assign({}, this._user);
  }

  /**
   *
   * @param providerId
   * @return {Promise.<TResult>|*}
   */
  unlink(providerId: string): Promise<User> {
    return getNativeModule(this._auth)
      .unlink(providerId)
      .then(user => this._auth._setUser(user));
  }

  /**
   * Update the current user's email
   *
   * @param  {string} email The user's _new_ email
   * @return {Promise}       A promise resolved upon completion
   */
  updateEmail(email: string): Promise<void> {
    return getNativeModule(this._auth)
      .updateEmail(email)
      .then(user => {
        this._auth._setUser(user);
      });
  }

  /**
   * Update the current user's password
   * @param  {string} password the new password
   * @return {Promise}
   */
  updatePassword(password: string): Promise<void> {
    return getNativeModule(this._auth)
      .updatePassword(password)
      .then(user => {
        this._auth._setUser(user);
      });
  }

  /**
   * Update the current user's profile
   * @param  {Object} updates An object containing the keys listed [here](https://firebase.google.com/docs/auth/ios/manage-users#update_a_users_profile)
   * @return {Promise}
   */
  updateProfile(updates: UpdateProfile = {}): Promise<void> {
    return getNativeModule(this._auth)
      .updateProfile(updates)
      .then(user => {
        this._auth._setUser(user);
      });
  }

  /**
   * KNOWN UNSUPPORTED METHODS
   */

  linkWithPhoneNumber() {
    throw new Error(
      INTERNALS.STRINGS.ERROR_UNSUPPORTED_CLASS_METHOD('User', 'linkWithPhoneNumber')
    );
  }

  linkWithPopup() {
    throw new Error(INTERNALS.STRINGS.ERROR_UNSUPPORTED_CLASS_METHOD('User', 'linkWithPopup'));
  }

  linkWithRedirect() {
    throw new Error(INTERNALS.STRINGS.ERROR_UNSUPPORTED_CLASS_METHOD('User', 'linkWithRedirect'));
  }

  reauthenticateWithPhoneNumber() {
    throw new Error(
      INTERNALS.STRINGS.ERROR_UNSUPPORTED_CLASS_METHOD('User', 'reauthenticateWithPhoneNumber')
    );
  }

  reauthenticateWithPopup() {
    throw new Error(
      INTERNALS.STRINGS.ERROR_UNSUPPORTED_CLASS_METHOD('User', 'reauthenticateWithPopup')
    );
  }

  reauthenticateWithRedirect() {
    throw new Error(
      INTERNALS.STRINGS.ERROR_UNSUPPORTED_CLASS_METHOD('User', 'reauthenticateWithRedirect')
    );
  }

  updatePhoneNumber() {
    throw new Error(INTERNALS.STRINGS.ERROR_UNSUPPORTED_CLASS_METHOD('User', 'updatePhoneNumber'));
  }

  get refreshToken(): string {
    throw new Error(INTERNALS.STRINGS.ERROR_UNSUPPORTED_CLASS_PROPERTY('User', 'refreshToken'));
  }
}
