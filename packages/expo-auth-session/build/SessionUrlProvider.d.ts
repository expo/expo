export interface SessionUrlProvider {
    getDefaultReturnUrl: () => string;
    getStartUrl: (authUrl: string, returnUrl: string) => string;
    getRedirectUrl: (urlPath?: string) => string;
}
export declare function getSessionUrlProvider(): SessionUrlProvider;
