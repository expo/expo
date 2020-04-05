import { AuthSessionOptions, AuthSessionResult } from './AuthSession.types';
export declare function startAsync(options: AuthSessionOptions): Promise<AuthSessionResult>;
export declare function dismiss(): void;
export declare function getDefaultReturnUrl(): string;
export declare function getRedirectUrl(): string;
export { resolveProviderConfigAsync, fetchProviderConfigAsync, ProviderConfig, DiscoveryDocument, IssuerOrProviderConfig, } from './ProviderConfig';
