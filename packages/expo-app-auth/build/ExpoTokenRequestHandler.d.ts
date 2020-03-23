import { AuthorizationServiceConfiguration, BaseTokenRequestHandler, QueryStringUtils, Requestor, RevokeTokenRequest, TokenRequest, TokenResponse } from '@openid/appauth';
import { ExpoAuthorizationServiceConfiguration, ExpoAuthorizationServiceConfigurationJson } from './ExpoAuthorizationServiceConfiguration';
/**
 * The default token request handler.
 */
export declare class ExpoTokenRequestHandler extends BaseTokenRequestHandler {
    constructor(requestor?: Requestor, utils?: QueryStringUtils);
    performRevokeTokenRequest(configuration: AuthorizationServiceConfiguration | ExpoAuthorizationServiceConfiguration, request: RevokeTokenRequest): Promise<boolean>;
    private getHeaders;
    performTokenRequest(configuration: AuthorizationServiceConfiguration | ExpoAuthorizationServiceConfigurationJson, request: TokenRequest): Promise<TokenResponse>;
}
