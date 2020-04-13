import { AuthRequest } from './AuthRequest';
import { AuthRequestConfig, AuthRequestPromptOptions, CodeChallengeMethod, ResponseType } from './AuthRequest.types';
import { AuthSessionOptions, AuthSessionResult } from './AuthSession.types';
import { DiscoveryDocument, fetchDiscoveryAsync, Issuer, IssuerOrDiscovery, ProviderMetadata, resolveDiscoveryAsync } from './Discovery';
export declare function startAsync(options: AuthSessionOptions): Promise<AuthSessionResult>;
export declare function dismiss(): void;
export declare function getDefaultReturnUrl(): string;
export declare function getRedirectUrl(path?: string): string;
/**
 * Build an `AuthRequest` and load it before returning.
 *
 * @param config
 * @param issuerOrDiscovery
 */
export declare function loadAsync(config: AuthRequestConfig, issuerOrDiscovery: IssuerOrDiscovery): Promise<AuthRequest>;
export * from './AuthRequestHooks';
export { AuthError } from './Errors';
export { AuthRequest, AuthRequestConfig, AuthRequestPromptOptions, CodeChallengeMethod, DiscoveryDocument, Issuer, IssuerOrDiscovery, ProviderMetadata, ResponseType, resolveDiscoveryAsync, fetchDiscoveryAsync, };
