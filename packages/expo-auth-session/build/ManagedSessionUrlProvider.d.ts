import { SessionUrlProvider } from './SessionUrlProvider';
export declare class ManagedSessionUrlProvider implements SessionUrlProvider {
    private static readonly BASE_URL;
    private static readonly SESSION_PATH;
    private static readonly USES_CUSTOM_SCHEME;
    private static readonly HOST_URI;
    private static readonly IS_EXPO_HOSTED;
    getDefaultReturnUrl(): string;
    getStartUrl(authUrl: string, returnUrl: string): string;
    getRedirectUrl(): string;
    static getHostUri(): string;
    private static warnIfAnonymous;
    private static removeScheme;
    private static removeLeadingSlash;
    private static removeTrailingSlash;
}
