export declare type FacebookAuth = {
    token: string;
    userID: string;
    appID: string;
    permissions?: string[];
    declinedPermissions?: string[];
    expiredPermissions?: string[];
    expires: number;
    dataAccessExpires: number;
    refresh?: number;
    tokenSource?: string;
    signedRequest?: string;
    graphDomain?: string;
};
export declare type FacebookLoginResult = {
    type: 'cancel';
} | ({
    type: 'success';
} & FacebookAuth);
export declare type FacebookOptions = {
    permissions?: string[];
};
export declare type SDKScriptURLOptions = {
    domain?: string;
    language?: string;
    isCustomerSupportChatEnabled?: boolean;
    /**
     * To improve performance, the JavaScript SDK is loaded minified.
     * You can also load a debug version of the JavaScript SDK that includes more logging and stricter argument checking as well as being non-minified.
     *
     * The debug version should not be used in your production environment, as its payload is larger and is worse for the performance of your page.
     */
    isDebugEnabled?: boolean;
};
export declare type SDKInitOptions = {
    appId?: string;
    autoLogAppEvents?: boolean;
    /**
     * With xfbml set to true, the SDK will parse your page's DOM to find and initialize any social plugins that have been added using XFBML.
     * If you're not using social plugins on the page, setting xfbml to false will improve page load times.
     * You can find out more about this by looking at Social Plugins.
     */
    xfbml?: boolean;
    /**
     * Required for web.
     * https://developers.facebook.com/docs/javascript/reference/FB.init/v5.0
     */
    version?: string;
};
export declare type NativeInitOptions = {
    /**
     * An optional Facebook App Name argument
     */
    appName?: string;
};
export declare type InitOptions = SDKScriptURLOptions & SDKInitOptions & NativeInitOptions;
