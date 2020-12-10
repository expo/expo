import { AuthRequest } from './AuthRequest';
import { AuthRequestConfig, AuthRequestPromptOptions } from './AuthRequest.types';
import { AuthSessionResult } from './AuthSession.types';
import { DiscoveryDocument, IssuerOrDiscovery } from './Discovery';
/**
 * Fetch the discovery document from an OpenID Connect issuer.
 *
 * @param issuerOrDiscovery
 */
export declare function useAutoDiscovery(issuerOrDiscovery: IssuerOrDiscovery): DiscoveryDocument | null;
export declare function useLoadedAuthRequest(config: AuthRequestConfig, discovery: DiscoveryDocument | null, AuthRequestInstance: typeof AuthRequest): AuthRequest | null;
declare type PromptMethod = (options?: AuthRequestPromptOptions) => Promise<AuthSessionResult>;
export declare function useAuthRequestResult(request: AuthRequest | null, discovery: DiscoveryDocument | null, customOptions?: AuthRequestPromptOptions): [AuthSessionResult | null, PromptMethod];
/**
 * Load an authorization request.
 * Returns a loaded request, a response, and a prompt method.
 * When the prompt method completes then the response will be fulfilled.
 *
 * @param config
 * @param discovery
 */
export declare function useAuthRequest(config: AuthRequestConfig, discovery: DiscoveryDocument | null): [
    AuthRequest | null,
    AuthSessionResult | null,
    (options?: AuthRequestPromptOptions) => Promise<AuthSessionResult>
];
export {};
