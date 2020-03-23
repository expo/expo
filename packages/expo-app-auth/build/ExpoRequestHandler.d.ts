import { AuthorizationRequest, AuthorizationRequestHandler, AuthorizationRequestResponse, Crypto, QueryStringUtils, StorageBackend, LocationLike } from '@openid/appauth';
import { ExpoAuthorizationServiceConfiguration } from './ExpoAuthorizationServiceConfiguration';
export declare class ExpoRequestHandler extends AuthorizationRequestHandler {
    locationLike: LocationLike;
    storageBackend: StorageBackend;
    static getQueryParams: (url: string) => Record<string, string>;
    private error;
    private request;
    private authPromise?;
    private url?;
    constructor(locationLike?: LocationLike, storageBackend?: StorageBackend, utils?: QueryStringUtils, crypto?: Crypto);
    performAuthorizationRequest(configuration: any | ExpoAuthorizationServiceConfiguration, request: AuthorizationRequest): void;
    private getQueryParams;
    completeAuthorizationRequestWithRequestAsync(handle: string, request: AuthorizationRequest): Promise<AuthorizationRequestResponse | null>;
    getOrRehydrateRequestAsync(): Promise<AuthorizationRequest | null>;
    /**
     * Attempts to introspect the contents of storage backend and completes the
     * request.
     */
    protected completeAuthorizationRequest(): Promise<AuthorizationRequestResponse | null>;
}
