import { Subscription } from '@unimodules/core';
import { SignInWithAppleOptions, SignInWithAppleCredential, SignInWithAppleCredentialState, RevokeListener } from './AppleAuthentication.types';
/**
 * A method which returns a Promise which resolves to a boolean if you are able to perform a Sign In with Apple.
 * Generally users need to be on iOS 13+.
 */
export declare function isAvailableAsync(): Promise<boolean>;
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
export declare function requestAsync(options: SignInWithAppleOptions): Promise<SignInWithAppleCredential>;
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
export declare function getCredentialStateAsync(userId: string): Promise<SignInWithAppleCredentialState>;
/**
 * Adds a listener for when a token has been revoked.
 * This means that the user has signed out and you should update your UI to reflect this
 *
 * @example
 * ```ts
 * import * as SignInWithApple from "expo-apple-authentication";
 *
 * // Subscribe
 * const unsubscribe = SignInWithApple.addRevokeListener(() => {
 *   // Handle the token being revoked
 * })
 *
 * // Unsubscribe
 * unsubscribe();
 * ```
 */
export declare function addRevokeListener(listener: RevokeListener): Subscription;
