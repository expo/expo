import { OAuthBaseProps, OAuthProps, OAuthRevokeOptions, TokenResponse, AuthServiceConfig } from './AppAuth.types';
import { ExpoAuthorizationServiceConfiguration } from './ExpoAuthorizationServiceConfiguration';
import { ExpoRequestor } from './ExpoRequestor';
export * from './AppAuth.types';
export declare type AuthServiceConfigJson = {
    authorizationEndpoint: string;
    tokenEndpoint: string;
    revocationEndpoint: string;
    endSessionEndpoint?: string;
    userInfoEndpoint?: string;
};
export declare function createServiceConfig(options: AuthServiceConfigJson): ExpoAuthorizationServiceConfiguration;
export declare function getDefaultOAuthRedirect(): string;
export declare function fetchServiceConfigAsync(issuer: string): Promise<AuthServiceConfig>;
export declare function authAsync(props: OAuthProps): Promise<TokenResponse>;
export declare function refreshAsync(props: OAuthProps, refreshToken: string): Promise<TokenResponse>;
export declare function revokeAsync({ clientId, issuer, serviceConfiguration }: OAuthBaseProps, { token, isClientIdProvided }: OAuthRevokeOptions): Promise<any>;
export declare const OAuthRedirect: any, URLSchemes: any;
export { ExpoAuthorizationServiceConfiguration, ExpoRequestor };
