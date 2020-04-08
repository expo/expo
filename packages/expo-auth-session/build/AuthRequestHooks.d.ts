import { AuthRequest, AuthRequestConfig } from './AuthRequest';
import { AuthSessionResult } from './AuthSession.types';
import { Discovery, IssuerOrDiscovery } from './Discovery';
export declare function useLinking(): string | null;
export declare function useQueryParams(): Record<string, string> | null;
export declare function clearQueryParams(): void;
export declare function useDiscovery(issuerOrDiscovery: IssuerOrDiscovery): Discovery | null;
export declare function useCompleteRedirect(): AuthSessionResult | null;
export declare function useAuthRequest(config: AuthRequestConfig): AuthRequest | null;
