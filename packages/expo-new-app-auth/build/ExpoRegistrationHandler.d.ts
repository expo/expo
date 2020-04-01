import { StringMap } from '@openid/appauth';
import GrantType from './GrantType';
import { RegistrationHandler, RegistrationRequest, RegistrationResponse } from './RegistrationHandler';
export declare type ExpoRegistrationResponseJson = {
    clientIdIssuedAt: number;
    clientSecretExpiresAt: number;
    clientId: string;
    clientSecret: string;
    registrationAccessToken: string;
    registrationClientUri: string;
    extras: StringMap;
};
export declare class ExpoRegistrationResponse extends RegistrationResponse {
    constructor(options: ExpoRegistrationResponseJson);
}
export interface ExpoRegistrationRequestJson {
    /**
     * Client's redirect URI's
     *
     * https://tools.ietf.org/html/rfc6749#section-3.1.2
     */
    redirectUris: string[];
    /**
     * Response types to use.
     *
     * [OpenID Connect Core 1.0, Section 3](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.3)
     */
    responseTypes: string[];
    /**
     * Grant types to use.
     *
     * [OpenID Connect Dynamic Client Registration 1.0, Section 2](https://openid.net/specs/openid-connect-discovery-1_0.html#rfc.section.2)
     */
    grantTypes: GrantType[];
    /**
     * Subject type to use.
     *
     * [OpenID Connect Core 1.0, Section 8](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.8)
     */
    subjectType?: string;
    /**
     * Client auth method to use at the token endpoint.
     *
     * [OpenID Connect Core 1.0, Section 9](https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.9)
     */
    tokenEndpointAuthMethod?: string;
    initialAccessToken?: string;
    extras?: Record<string, any>;
}
export declare class ExpoRegistrationRequest extends RegistrationRequest {
    constructor(options: ExpoRegistrationRequestJson);
}
export declare class ExpoRegistrationHandler extends RegistrationHandler {
}
