import { AuthorizationRequest, AuthorizationResponse, TokenResponse } from '@openid/appauth';
import { ExpoAccessTokenRequestJson } from './ExpoAccessTokenRequest';
import { ExpoAuthorizationRequest } from './ExpoAuthorizationRequest';
import { ExpoAuthorizationServiceConfiguration, ExpoAuthorizationServiceConfigurationJson } from './ExpoAuthorizationServiceConfiguration';
import { ExpoRefreshTokenRequestJson } from './ExpoRefreshTokenRequest';
import { ExpoRegistrationRequestJson, ExpoRegistrationResponse } from './ExpoRegistrationHandler';
import { ExpoRevokeTokenRequestJson } from './ExpoRevokeTokenRequest';
declare type IssuerOrServiceConfig = string | ExpoAuthorizationServiceConfiguration | ExpoAuthorizationServiceConfigurationJson;
/**
 * Wrap the browser API and make it more node friendly.
 *
 * @param props
 */
export declare function authAsync(request: ExpoAuthorizationRequest, issuerOrServiceConfig: IssuerOrServiceConfig): Promise<TokenResponse | AuthorizationResponse>;
/**
 * Make an auth request that returns the auth code which can be exchanged for an access token.
 *
 * @param props
 * @param issuerOrServiceConfig
 */
export declare function authRequestAsync(request: ExpoAuthorizationRequest, issuerOrServiceConfig: IssuerOrServiceConfig): Promise<{
    request: AuthorizationRequest;
    response: AuthorizationResponse;
}>;
export declare function exchangeAsync(props: ExpoAccessTokenRequestJson, issuerOrServiceConfig: IssuerOrServiceConfig): Promise<TokenResponse>;
export declare function refreshAsync(props: ExpoRefreshTokenRequestJson, issuerOrServiceConfig: IssuerOrServiceConfig): Promise<TokenResponse>;
export declare function registerAsync(props: ExpoRegistrationRequestJson, issuerOrServiceConfig: IssuerOrServiceConfig): Promise<ExpoRegistrationResponse>;
export declare function revokeAsync(props: ExpoRevokeTokenRequestJson, issuerOrServiceConfig: IssuerOrServiceConfig): Promise<any>;
export {};
