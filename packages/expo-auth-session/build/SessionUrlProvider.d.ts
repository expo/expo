export interface SessionUrlProvider {
    getDefaultReturnUrl: () => string;
    getStartUrl: (authUrl: string, returnUrl: string) => string;
    getRedirectUrl: () => string;
}
export declare function getSessionUrlProvider(): SessionUrlProvider;
