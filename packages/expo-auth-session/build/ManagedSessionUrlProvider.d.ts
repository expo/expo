import { SessionUrlProvider } from './SessionUrlProvider';
export declare class ManagedSessionUrlProvider implements SessionUrlProvider {
    private static readonly BASE_URL;
    private static readonly SESSION_PATH;
    private static readonly USES_CUSTOM_SCHEME;
    getDefaultReturnUrl(urlPath?: string): string;
    getStartUrl(authUrl: string, returnUrl: string): string;
    getRedirectUrl(): string;
    private static getHostAddress;
    private static warnIfAnonymous;
    private static removeScheme;
    private static removeLeadingSlash;
    private static removeTrailingSlash;
}
