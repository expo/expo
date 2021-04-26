import { OAuthBaseProps, OAuthProps, OAuthRevokeOptions, TokenResponse } from './AppAuth.types';
export * from './AppAuth.types';
export declare function getDefaultOAuthRedirect(): string;
export declare function authAsync(props: OAuthProps): Promise<TokenResponse>;
export declare function refreshAsync(props: OAuthProps, refreshToken: string): Promise<TokenResponse>;
export declare function revokeAsync({ clientId, issuer, serviceConfiguration }: OAuthBaseProps, { token, isClientIdProvided }: OAuthRevokeOptions): Promise<any>;
export declare const OAuthRedirect: any, URLSchemes: any;
