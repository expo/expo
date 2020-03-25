import { AuthorizationRequest, AuthorizationResponse, TokenResponse } from '@openid/appauth';
import { ExpoAccessTokenRequestJson } from './ExpoAccessTokenRequest';
import { ExpoAuthorizationRequest, ExpoAuthorizationRequestJson } from './ExpoAuthorizationRequest';
import { ExpoAuthorizationServiceConfiguration, ExpoAuthorizationServiceConfigurationJson } from './ExpoAuthorizationServiceConfiguration';
import { ExpoRefreshTokenRequestJson } from './ExpoRefreshTokenRequest';
import { RegistrationResponse } from './RegistrationHandler';
import { ExpoRegistrationRequestJson } from './ExpoRegistrationHandler';
import { ExpoRevokeTokenRequestJson } from './ExpoRevokeTokenRequest';
export declare type IssuerOrServiceConfig = string | ExpoAuthorizationServiceConfiguration | ExpoAuthorizationServiceConfigurationJson;
/**
 * Utility method for resolving the service config from an issuer or object.
 *
 * @param issuerOrServiceConfig
 */
export declare function resolveServiceConfigAsync(issuerOrServiceConfig: IssuerOrServiceConfig): Promise<ExpoAuthorizationServiceConfiguration>;
/**
 * Authenticate and auto exchange the code for an access token.
 */
export declare function authAsync(props: ExpoAuthorizationRequestJson, issuerOrServiceConfig: IssuerOrServiceConfig): Promise<TokenResponse>;
/**
 * Make an auth request that returns the auth code which can be exchanged for an access token.
 *
 * @param request
 * @param issuerOrServiceConfig
 */
export declare function authRequestAsync(request: ExpoAuthorizationRequest, issuerOrServiceConfig: IssuerOrServiceConfig): Promise<{
    request: AuthorizationRequest;
    response: AuthorizationResponse;
}>;
export declare function exchangeAsync(props: ExpoAccessTokenRequestJson, issuerOrServiceConfig: IssuerOrServiceConfig): Promise<TokenResponse>;
export declare function refreshAsync(props: ExpoRefreshTokenRequestJson, issuerOrServiceConfig: IssuerOrServiceConfig): Promise<TokenResponse>;
export declare function registerAsync(props: ExpoRegistrationRequestJson, issuerOrServiceConfig: IssuerOrServiceConfig): Promise<RegistrationResponse>;
export declare function revokeAsync(props: ExpoRevokeTokenRequestJson, issuerOrServiceConfig: IssuerOrServiceConfig): Promise<boolean>;
