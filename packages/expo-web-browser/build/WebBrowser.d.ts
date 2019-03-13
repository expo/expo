declare type OpenBrowserParams = {
    toolbarColor?: string;
    package?: string;
    enableBarCollapsing?: boolean;
    showTitle?: boolean;
};
declare type AuthSessionResult = RedirectResult | BrowserResult;
declare type CustomTabsBrowsersResults = {
    default: String[];
    packages: String[];
};
declare type BrowserResult = {
    type: 'cancel' | 'dismiss';
};
declare type RedirectResult = {
    type: 'success';
    url: string;
};
export declare function getCustomTabsSupportingBrowsersAsync(): Promise<CustomTabsBrowsersResults>;
export declare function openBrowserAsync(url: string, browserParams?: OpenBrowserParams): Promise<BrowserResult>;
export declare function dismissBrowser(): void;
export declare function openAuthSessionAsync(url: string, redirectUrl: string): Promise<AuthSessionResult>;
export declare function dismissAuthSession(): void;
export {};
