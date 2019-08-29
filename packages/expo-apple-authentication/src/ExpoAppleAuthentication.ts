import { UnavailabilityError } from '@unimodules/core';
import ExpoAppleAuthenticationNative from './ExpoAppleAuthenticationNative';

import {
  SignInWithAppleOptions,
  SignInWithAppleCredential,
  SignInWithAppleCredentialState,
  SignInWithAppleOperation,
} from './ExpoAppleAuthentication.types';

/**
 * A method which returns a Promise which resolves to a boolean if you are able to perform a Sign In with Apple.
 * Generally users need to be on iOS 13+.
 */
export async function isAvailableAsync(): Promise<boolean> {
  if (!ExpoAppleAuthenticationNative.isAvailableAsync) {
    return false;
  }
  return ExpoAppleAuthenticationNative.isAvailableAsync();
}

/**
 * Perform a Sign In with Apple request with the given SignInWithAppleOptions.
 * The method will return a Promise which will resolve to a SignInWithAppleCredential on success.
 * You should make sure you include error handling.
 *
 * @example
 * ```ts
 * import * as SignInWithApple from "expo-apple-authentication";
 *
 * SignInWithApple.requestAsync({
 *   requestedScopes: [
 *     SignInWithApple.Scope.FullName,
 *     SignInWithApple.Scope.Email,
 *   ]
 * }).then(credentials => {
 *   // Handle successful authenticated
 * }).catch(error => {
 *   // Handle authentication errors
 * })
 * ```
 */
export async function requestAsync(options: SignInWithAppleOptions): Promise<SignInWithAppleCredential> {
  if (!ExpoAppleAuthenticationNative.requestAsync) {
    throw new UnavailabilityError('expo-apple-authentication', 'requestAsync');
  }
  if (!options.requestedOperation) {
    options.requestedOperation = SignInWithAppleOperation.Login;
  }
  return ExpoAppleAuthenticationNative.requestAsync(options);
}

/**
 * You can query the current state of a user ID.
 * It will tell you if the token is still valid or if it has been revoked by the user.
 *
 * @see [Apple Documention](https://developer.apple.com/documentation/authenticationservices/asauthorizationappleidprovider/3175423-getcredentialstateforuserid) for more details.
 *
 * @example
 * ```ts
 * import * as SignInWithApple from "expo-apple-authentication";
 *
 * SignInWithApple.getCredentialStateAsync(userId).then(state => {
 *   switch (state) {
 *     case SignInWithAppleCredential.CredentialState.Authorized:
 *       // Handle the authorised state
 *       break;
 *     case SignInWithAppleCredential.CredentialState.Revoked:
 *       // The user has signed out
 *       break;
 *     case SignInWithAppleCredential.CredentialState.NotFound:
 *       // The user id was not found
 *       break;
 *   }
 * })
 * ```
 */
export async function getCredentialStateAsync(userId: string): Promise<SignInWithAppleCredentialState> {
  if (!ExpoAppleAuthenticationNative.getCredentialStateAsync) {
    throw new UnavailabilityError('expo-apple-authentication', 'getCredentialStateAsync');
  }
  return ExpoAppleAuthenticationNative.getCredentialStateAsync(userId);
}
