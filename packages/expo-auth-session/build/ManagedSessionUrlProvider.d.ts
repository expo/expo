import { SessionUrlProvider } from './SessionUrlProvider';
export declare class ManagedSessionUrlProvider implements SessionUrlProvider {
    /**
     * This method was moved to the top of this class, cause otherwise, ts compilation will fail with error:
     * - `Property 'hostUri' is used before its initialization.`
     */
    private static getHostAddress;
    private static readonly BASE_URL;
    private static readonly SESSION_PATH;
    private static readonly USES_CUSTOM_SCHEME;
    private static readonly HOST_ADDRESS;
    private static readonly IS_EXPO_HOSTED;
    getDefaultReturnUrl(urlPath?: string): string;
    getStartUrl(authUrl: string, returnUrl: string): string;
    getRedirectUrl(): string;
    private static warnIfAnonymous;
    private static removeScheme;
    private static removeLeadingSlash;
    private static removeTrailingSlash;
}
