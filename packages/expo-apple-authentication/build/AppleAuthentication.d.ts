import { Subscription } from '@unimodules/core';
import { AppleAuthenticationSignInOptions, AppleAuthenticationRefreshOptions, AppleAuthenticationSignOutOptions, AppleAuthenticationCredential, AppleAuthenticationCredentialState, AppleAuthenticationRevokeListener } from './AppleAuthentication.types';
export declare function isAvailableAsync(): Promise<boolean>;
export declare function signInAsync(options?: AppleAuthenticationSignInOptions): Promise<AppleAuthenticationCredential>;
export declare function refreshAsync(options: AppleAuthenticationRefreshOptions): Promise<AppleAuthenticationCredential>;
export declare function signOutAsync(options: AppleAuthenticationSignOutOptions): Promise<AppleAuthenticationCredential>;
export declare function getCredentialStateAsync(user: string): Promise<AppleAuthenticationCredentialState>;
export declare function addRevokeListener(listener: AppleAuthenticationRevokeListener): Subscription;
