import { AuthSessionRedirectUriOptions } from '../AuthSession';
export declare function applyRequiredScopes(scopes: string[] | undefined, requiredScopes: string[]): string[];
export declare function shouldUseProxy(): boolean;
export declare function invariantClientId(idName: string, value: any, providerName: string): void;
export declare function useProxyEnabled(redirectUriOptions: Pick<AuthSessionRedirectUriOptions, 'useProxy'>): boolean;
