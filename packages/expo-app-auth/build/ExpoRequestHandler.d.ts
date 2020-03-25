import { AuthorizationRequest, AuthorizationRequestHandler, AuthorizationRequestResponse, Crypto, QueryStringUtils, StringMap, StorageBackend, LocationLike } from '@openid/appauth';
import { ExpoAuthorizationServiceConfiguration } from './ExpoAuthorizationServiceConfiguration';
export declare class ExpoRequestHandler extends AuthorizationRequestHandler {
    locationLike: LocationLike;
    storageBackend: StorageBackend;
    static createLocationLike: (url: string) => LocationLike;
    static getQueryParams: (url: string) => Record<string, string>;
    private request;
    private authPromise?;
    constructor(locationLike?: LocationLike, storageBackend?: StorageBackend, utils?: QueryStringUtils, crypto?: Crypto);
    performAuthorizationRequest(configuration: any | ExpoAuthorizationServiceConfiguration, request: AuthorizationRequest): void;
    getQueryParams(): StringMap;
    getOrRehydrateRequestAsync(): Promise<AuthorizationRequest | null>;
    /**
     * Attempts to introspect the contents of storage backend and completes the
     * request.
     */
    protected completeAuthorizationRequest(): Promise<AuthorizationRequestResponse | null>;
}
