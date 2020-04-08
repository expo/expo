import { AuthSessionOptions, AuthSessionResult } from './AuthSession.types';
export declare function startAsync(options: AuthSessionOptions): Promise<AuthSessionResult>;
export declare function dismiss(): void;
export declare function getDefaultReturnUrl(): string;
export declare function getRedirectUrl(path?: string): string;
export { IssuerOrDiscovery, Discovery, resolveDiscoveryAsync, fetchDiscoveryAsync, DiscoveryDocument, } from './Discovery';
export * from './AuthRequest';
export * from './AuthRequestHooks';
