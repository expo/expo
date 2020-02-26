export declare type RedirectEvent = {
    url: string;
};
export declare type WebBrowserOpenOptions = {
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
export declare type WebBrowserAuthSessionResult = WebBrowserRedirectResult | WebBrowserResult;
export declare type WebBrowserCustomTabsResults = {
    defaultBrowserPackage?: string;
    preferredBrowserPackage?: string;
    browserPackages: string[];
    servicePackages: string[];
};
export declare const WebBrowserResultType: {
    /**
     * iOS only
     */
    readonly CANCEL: "cancel";
    /**
     * iOS only
     */
    readonly DISMISS: "dismiss";
    /**
     * Android only
     */
    readonly OPENED: "opened";
};
export declare type WebBrowserResultType = typeof WebBrowserResultType[keyof typeof WebBrowserResultType];
export declare type WebBrowserResult = {
    type: WebBrowserResultType;
};
export declare type WebBrowserRedirectResult = {
    type: 'success';
    url: string;
};
export declare type ServiceActionResult = {
    servicePackage?: string;
};
export declare type WebBrowserMayInitWithUrlResult = ServiceActionResult;
export declare type WebBrowserWarmUpResult = ServiceActionResult;
export declare type WebBrowserCoolDownResult = ServiceActionResult;
