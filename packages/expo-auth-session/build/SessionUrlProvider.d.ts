import * as Linking from 'expo-linking';
export declare class SessionUrlProvider {
    private static readonly BASE_URL;
    private static readonly SESSION_PATH;
    getDefaultReturnUrl(urlPath?: string, options?: Omit<Linking.CreateURLOptions, 'queryParams'>): string;
    getStartUrl(authUrl: string, returnUrl: string, projectNameForProxy: string | undefined): string;
    getRedirectUrl(options: {
        projectNameForProxy?: string;
        urlPath?: string;
    }): string;
    private static getHostAddressQueryParams;
    private static warnIfAnonymous;
    private static removeScheme;
    private static removeLeadingSlash;
}
declare const _default: SessionUrlProvider;
export default _default;
//# sourceMappingURL=SessionUrlProvider.d.ts.map