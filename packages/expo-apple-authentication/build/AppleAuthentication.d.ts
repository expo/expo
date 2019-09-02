import { Subscription } from '@unimodules/core';
import { AppleAuthenticationLoginOptions, AppleAuthenticationRefreshOptions, AppleAuthenticationLogoutOptions, AppleAuthenticationCredential, AppleAuthenticationCredentialState, AppleAuthenticationRevokeListener } from './AppleAuthentication.types';
/**
 * A method which returns a Promise which resolves to a boolean if you are able to perform a Sign In with Apple.
 * Generally users need to be on iOS 13+.
 */
export declare function isAvailableAsync(): Promise<boolean>;
/**
 * Perform a Sign In with Apple request with the given `AppleAuthenticationLoginOptions`.
 * The method will return a Promise which will resolve to a `AppleAuthenticationCredential` on success.
 * You should make sure you include error handling.
 */
export declare function loginAsync(options: AppleAuthenticationLoginOptions): Promise<AppleAuthenticationCredential>;
export declare function refreshAsync(options: AppleAuthenticationRefreshOptions): Promise<AppleAuthenticationCredential>;
export declare function logoutAsync(options: AppleAuthenticationLogoutOptions): Promise<AppleAuthenticationCredential>;
/**
 * You can query the current state of a user ID.
 * It will tell you if the token is still valid or if it has been revoked by the user.
 *
 * @see [Apple Documention](https://developer.apple.com/documentation/authenticationservices/asauthorizationappleidprovider/3175423-getcredentialstateforuserid) for more details.
 */
export declare function getCredentialStateAsync(userId: string): Promise<AppleAuthenticationCredentialState>;
/**
 * Adds a listener for when a token has been revoked.
 * This means that the user has signed out and you should update your UI to reflect this
 */
export declare function addRevokeListener(listener: AppleAuthenticationRevokeListener): Subscription;
