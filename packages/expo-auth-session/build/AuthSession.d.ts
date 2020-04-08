import { AuthSessionOptions, AuthSessionResult } from './AuthSession.types';
export declare function startAsync(options: AuthSessionOptions): Promise<AuthSessionResult>;
export declare function dismiss(): void;
export declare function getDefaultReturnUrl(): string;
export declare function getRedirectUrl(path?: string): string;
export { resolveDiscoveryAsync, fetchDiscoveryAsync, Discovery, DiscoveryDocument, IssuerOrDiscovery, } from './Discovery';
