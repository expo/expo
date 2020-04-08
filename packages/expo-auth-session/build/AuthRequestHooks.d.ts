import { AuthRequest } from './AuthRequest';
import { AuthRequestConfig, AuthRequestPromptOptions } from './AuthRequest.types';
import { AuthSessionResult } from './AuthSession.types';
import { Discovery, IssuerOrDiscovery } from './Discovery';
import { Headers } from './Fetch';
export declare function useDiscovery(issuerOrDiscovery: IssuerOrDiscovery): Discovery | null;
export declare function useJsonFetchRequest<T>(accessToken: string, requestUrl: string, headers: Headers, method?: string): [T | null, Error | null];
export declare function useAuthRequest(config: AuthRequestConfig, discovery: Discovery | null): [AuthRequest | null, AuthSessionResult | null, (options: AuthRequestPromptOptions) => Promise<AuthSessionResult>];
