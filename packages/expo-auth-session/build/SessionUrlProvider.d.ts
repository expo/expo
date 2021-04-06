export declare class SessionUrlProvider {
    private static readonly BASE_URL;
    private static readonly SESSION_PATH;
    getDefaultReturnUrl(urlPath?: string): string;
    getStartUrl(authUrl: string, returnUrl: string): string;
    getRedirectUrl(urlPath?: string): string;
    private static getHostAddress;
    private static warnIfAnonymous;
    private static removeScheme;
    private static removeLeadingSlash;
    private static removeTrailingSlash;
}
declare const _default: SessionUrlProvider;
export default _default;
