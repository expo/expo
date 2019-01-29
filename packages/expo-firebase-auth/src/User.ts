import { INTERNALS } from 'expo-firebase-app';
// import Auth from './';
import {
  ActionCodeSettings,
  AuthCredential,
  NativeUser,
  UserCredential,
  UserInfo,
  UserMetadata,
  IdTokenResult,
} from './types';

type Auth = any;

type UpdateProfile = {
  displayName?: string;
  photoURL?: string;
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

  get displayName(): string | null {
    return this._user.displayName || null;
  }

  get email(): string | null {
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

  get phoneNumber(): string | null {
    return this._user.phoneNumber || null;
  }

  get photoURL(): string | null {
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
  async delete(): Promise<User> {
    await this._auth.nativeModule.delete();
    return this._auth._setUser();
  }

  /**
   * Returns a JWT token used to identify the user to a Firebase service.
   *
   * @param forceRefresh boolean Force refresh regardless of token expiration.
   * @return {Promise<string>}
   */
  async getIdToken(forceRefresh: boolean = false): Promise<string> {
    return await this._auth.nativeModule.getIdToken(forceRefresh);
  }

  /**
   * Returns a IdTokenResult object which contains the ID token JWT string and other properties for getting
   * data associated with the token and all the decoded payload claims.
   *
   * @param forceRefresh boolean Force refresh regardless of token expiration.
   * @return {Promise<IdTokenResult>}
   */
  async getIdTokenResult(forceRefresh: boolean = false): Promise<IdTokenResult> {
    return await this._auth.nativeModule.getIdTokenResult(forceRefresh);
  }

  /**
   * @param credential
   */
  async linkWithCredential(credential: AuthCredential): Promise<UserCredential> {
    const userCredential = await this._auth.nativeModule.linkWithCredential(
      credential.providerId,
      credential.token,
      credential.secret
    );
    return await this._auth._setUserCredential(userCredential);
  }

  /**
   * @deprecated Deprecated linkAndRetrieveDataWithCredential in favor of linkWithCredential.
   * @param credential
   */
  async linkAndRetrieveDataWithCredential(credential: AuthCredential): Promise<UserCredential> {
    console.warn('Deprecated linkAndRetrieveDataWithCredential in favor of linkWithCredential.');
    return await this.linkAndRetrieveDataWithCredential(credential);
  }

  /**
   * Re-authenticate a user with a third-party authentication provider
   * @return {Promise}         A promise resolved upon completion
   */
  async reauthenticateWithCredential(credential: AuthCredential): Promise<UserCredential> {
    const userCredential = await this._auth.nativeModule.reauthenticateWithCredential(
      credential.providerId,
      credential.token,
      credential.secret
    );
    return await this._auth._setUserCredential(userCredential);
  }

  /**
   * Re-authenticate a user with a third-party authentication provider
   *
   * @deprecated Deprecated reauthenticateAndRetrieveDataWithCredential in favor of reauthenticateWithCredential.
   * @return {Promise}         A promise resolved upon completion
   */
  async reauthenticateAndRetrieveDataWithCredential(
    credential: AuthCredential
  ): Promise<UserCredential> {
    console.warn(
      'Deprecated reauthenticateAndRetrieveDataWithCredential in favor of reauthenticateWithCredential.'
    );
    return await this.reauthenticateWithCredential(credential);
  }

  /**
   * Reload the current user
   * @return {Promise}
   */
  async reload(): Promise<User> {
    const user = await this._auth.nativeModule.reload();
    return await this._auth._setUser(user);
  }

  /**
   * Send verification email to current user.
   */
  async sendEmailVerification(actionCodeSettings?: ActionCodeSettings): Promise<User> {
    const user = await this._auth.nativeModule.sendEmailVerification(actionCodeSettings);
    return await this._auth._setUser(user);
  }

  toJSON(): { [key: string]: any } {
    return Object.assign({}, this._user);
  }

  /**
   *
   * @param providerId
   * @return {Promise.<TResult>|*}
   */
  async unlink(providerId: string): Promise<User> {
    const user = await this._auth.nativeModule.unlink(providerId);
    return await this._auth._setUser(user);
  }

  /**
   * Update the current user's email
   *
   * @param  {string} email The user's _new_ email
   * @return {Promise}       A promise resolved upon completion
   */
  async updateEmail(email: string): Promise<void> {
    const user = await this._auth.nativeModule.updateEmail(email);
    return await this._auth._setUser(user);
  }

  /**
   * Update the current user's password
   * @param  {string} password the new password
   * @return {Promise}
   */
  async updatePassword(password: string): Promise<User> {
    const user = await this._auth.nativeModule.updatePassword(password);
    return await this._auth._setUser(user);
  }

  /**
   * Update the current user's phone number
   *
   * @param  {AuthCredential} credential Auth credential with the _new_ phone number
   * @return {Promise}
   */
  async updatePhoneNumber(credential: AuthCredential): Promise<User> {
    const user = await this._auth.nativeModule.updatePhoneNumber(
      credential.providerId,
      credential.token,
      credential.secret
    );
    return await this._auth._setUser(user);
  }

  /**
   * Update the current user's profile
   * @param  {Object} updates An object containing the keys listed [here](https://firebase.google.com/docs/auth/ios/manage-users#update_a_users_profile)
   * @return {Promise}
   */
  async updateProfile(updates: UpdateProfile = {}): Promise<User> {
    const user = await this._auth.nativeModule.updateProfile(updates);
    return this._auth._setUser(user);
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

  get refreshToken(): string {
    throw new Error(INTERNALS.STRINGS.ERROR_UNSUPPORTED_CLASS_PROPERTY('User', 'refreshToken'));
  }
}
