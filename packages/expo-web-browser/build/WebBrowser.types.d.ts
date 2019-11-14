export declare type RedirectEvent = {
    url: string;
};
export declare type OpenBrowserOptions = {
    toolbarColor?: string;
    browserPackage?: string;
    enableBarCollapsing?: boolean;
    showTitle?: boolean;
    /** Android only */
    showInRecents?: boolean;
    /** iOS only */
    controlsColor?: string;
    windowName?: string;
    windowFeatures?: string;
};
export declare type AuthSessionResult = RedirectResult | BrowserResult;
export declare type CustomTabsBrowsersResults = {
    defaultBrowserPackage?: string;
    preferredBrowserPackage?: string;
    browserPackages: string[];
    servicePackages: string[];
};
export declare type BrowserResult = {
    type: 'cancel' | 'dismiss' | 'opened';
};
export declare type RedirectResult = {
    type: 'success';
    url: string;
};
export declare type ServiceActionResult = {
    servicePackage?: string;
};
export declare type MayInitWithUrlResult = ServiceActionResult;
export declare type WarmUpResult = ServiceActionResult;
export declare type CoolDownResult = ServiceActionResult;
