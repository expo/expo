import { AuthorizationRequest, AuthorizationRequestJson, Crypto, StringMap } from '@openid/appauth';
export declare type CodeChallengeMethod = 'S256' | 'plain';
export interface ExpoAuthorizationRequestJson {
    responseType?: string;
    clientId: string;
    redirectUri: string;
    scopes: string[];
    state?: string;
    extras?: StringMap;
    internal?: StringMap;
}
/**
 * Represents the AuthorizationRequest.
 * For more information look at
 * https://tools.ietf.org/html/rfc6749#section-4.1.1
 */
export declare class ExpoAuthorizationRequest extends AuthorizationRequest {
    _crypto: Crypto;
    _usePkce: boolean;
    /**
     * Constructs a new AuthorizationRequest.
     * Use a `undefined` value for the `state` parameter, to generate a random
     * state for CSRF protection.
     */
    constructor(request: ExpoAuthorizationRequestJson, _crypto?: Crypto, _usePkce?: boolean);
    setupCodeVerifier(): Promise<void>;
    /**
     * Serializes the AuthorizationRequest to a JavaScript Object.
     */
    toJson(): Promise<AuthorizationRequestJson>;
}
