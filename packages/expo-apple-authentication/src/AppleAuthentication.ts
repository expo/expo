import { EventEmitter, Subscription, UnavailabilityError } from '@unimodules/core';
import ExpoAppleAuthentication from './ExpoAppleAuthentication';

import {
  RequestOptions,
  Credential,
  CredentialState,
  Operation,
  RevokeListener,
} from './AppleAuthentication.types';

/**
 * A method which returns a Promise which resolves to a boolean if you are able to perform a Sign In with Apple.
 * Generally users need to be on iOS 13+.
 */
export async function isAvailableAsync(): Promise<boolean> {
  if (!ExpoAppleAuthentication || !ExpoAppleAuthentication.isAvailableAsync) {
    return false;
  }
  return ExpoAppleAuthentication.isAvailableAsync();
}

/**
 * Perform a Sign In with Apple request with the given `RequestOptions`.
 * The method will return a Promise which will resolve to a `Credential` on success.
 * You should make sure you include error handling.
 *
 * @example
 * ```ts
 * import * as AppleAuthentication from "expo-apple-authentication";
 *
 * AppleAuthentication.requestAsync({
 *   requestedScopes: [
 *     AppleAuthentication.Scope.FullName,
 *     AppleAuthentication.Scope.Email,
 *   ]
 * }).then(credentials => {
 *   // Handle successful authenticated
 * }).catch(error => {
 *   // Handle authentication errors
 * })
 * ```
 */
export async function requestAsync(options: RequestOptions): Promise<Credential> {
  if (!ExpoAppleAuthentication.requestAsync) {
    throw new UnavailabilityError('expo-apple-authentication', 'requestAsync');
  }
  if (!options.requestedOperation) {
    options.requestedOperation = Operation.Login;
  }
  return ExpoAppleAuthentication.requestAsync(options);
}

/**
 * You can query the current state of a user ID.
 * It will tell you if the token is still valid or if it has been revoked by the user.
 *
 * @see [Apple Documention](https://developer.apple.com/documentation/authenticationservices/asauthorizationappleidprovider/3175423-getcredentialstateforuserid) for more details.
 *
 * @example
 * ```ts
 * import * as AppleAuthentication from "expo-apple-authentication";
 *
 * AppleAuthentication.getCredentialStateAsync(userId).then(state => {
 *   switch (state) {
 *     case Credential.CredentialState.Authorized:
 *       // Handle the authorised state
 *       break;
 *     case Credential.CredentialState.Revoked:
 *       // The user has signed out
 *       break;
 *     case Credential.CredentialState.NotFound:
 *       // The user id was not found
 *       break;
 *   }
 * })
 * ```
 */
export async function getCredentialStateAsync(userId: string): Promise<CredentialState> {
  if (!ExpoAppleAuthentication.getCredentialStateAsync) {
    throw new UnavailabilityError('expo-apple-authentication', 'getCredentialStateAsync');
  }
  return ExpoAppleAuthentication.getCredentialStateAsync(userId);
}

const ExpoAppleAuthenticationEventEmitter = new EventEmitter(ExpoAppleAuthentication);

/**
 * Adds a listener for when a token has been revoked.
 * This means that the user has signed out and you should update your UI to reflect this
 *
 * @example
 * ```ts
 * import * as AppleAuthentication from "expo-apple-authentication";
 *
 * // Subscribe
 * const unsubscribe = AppleAuthentication.addRevokeListener(() => {
 *   // Handle the token being revoked
 * })
 *
 * // Unsubscribe
 * unsubscribe();
 * ```
 */
export function addRevokeListener(listener: RevokeListener): Subscription {
  return ExpoAppleAuthenticationEventEmitter.addListener('Expo.appleIdCredentialRevoked', listener);
}
