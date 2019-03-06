declare type AuthSessionResult = RedirectResult | BrowserResult;
declare type CustomTabsBrowsersResults = {
    packages: String[];
};
declare type BrowserResult = {
    type: 'cancel' | 'dismiss';
};
declare type RedirectResult = {
    type: 'success';
    url: string;
};
export declare function getCustomTabsSupportingBrowsers(): Promise<CustomTabsBrowsersResults>;
export declare function openBrowserAsync(url: string): Promise<BrowserResult>;
export declare function dismissBrowser(): void;
export declare function openAuthSessionAsync(url: string, redirectUrl: string): Promise<AuthSessionResult>;
export declare function dismissAuthSession(): void;
export {};
