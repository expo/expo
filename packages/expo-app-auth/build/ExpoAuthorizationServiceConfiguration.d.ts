import { AuthorizationServiceConfiguration, Requestor } from '@openid/appauth';
/**
 * Extends AuthorizationServiceConfiguration adding support for discoveryDocument
 */
export declare class ExpoAuthorizationServiceConfiguration extends AuthorizationServiceConfiguration {
    discoveryDocument: Record<string, string | string[]>;
    constructor(request: any);
    toJson(): Record<string, string | string[]>;
    static fetchFromIssuer(openIdIssuerUrl: string, requestor?: Requestor): Promise<ExpoAuthorizationServiceConfiguration>;
}
