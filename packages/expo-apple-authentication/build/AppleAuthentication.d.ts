import { Subscription } from '@unimodules/core';
import { AppleAuthenticationLoginOptions, AppleAuthenticationRefreshOptions, AppleAuthenticationLogoutOptions, AppleAuthenticationCredential, AppleAuthenticationCredentialState, AppleAuthenticationRevokeListener } from './AppleAuthentication.types';
export declare function isAvailableAsync(): Promise<boolean>;
export declare function loginAsync(options: AppleAuthenticationLoginOptions): Promise<AppleAuthenticationCredential>;
export declare function refreshAsync(options: AppleAuthenticationRefreshOptions): Promise<AppleAuthenticationCredential>;
export declare function logoutAsync(options: AppleAuthenticationLogoutOptions): Promise<AppleAuthenticationCredential>;
export declare function getCredentialStateAsync(userId: string): Promise<AppleAuthenticationCredentialState>;
export declare function addRevokeListener(listener: AppleAuthenticationRevokeListener): Subscription;
