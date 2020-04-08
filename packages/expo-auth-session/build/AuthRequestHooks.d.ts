import { AuthRequest, AuthRequestConfig } from './AuthRequest';
import { Discovery, IssuerOrDiscovery } from './Discovery';
import { Headers } from './Fetch';
export declare function useDiscovery(issuerOrDiscovery: IssuerOrDiscovery): Discovery | null;
export declare function useJsonFetchRequest<T>(accessToken: string, requestUrl: string, headers: Headers, method?: string): [T | null, Error | null];
export declare function useAuthRequest(config: AuthRequestConfig, discovery: Discovery | null): AuthRequest | null;
