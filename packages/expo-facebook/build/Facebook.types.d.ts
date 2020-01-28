export declare type FacebookAuth = {
    /**
     * Access token for the authenticated session. This'll provide access to use with Facebook Graph API.
     */
    token: string;
    /**
     * The ID of the user.
     */
    userID: string;
    /**
     * Application ID used to initialize the FBSDK app.
     */
    appID: string;
    /**
     * List of granted permissions.
     */
    permissions?: string[];
    /**
     * List of requested permissions that the user has declined.
     */
    declinedPermissions?: string[];
    /**
     * List of permissions that were expired with this access token.
     */
    expiredPermissions?: string[];
    /**
     * Gets the time in milliseconds at which the `token` expires.
     */
    expires: number;
    /**
     * Time in milliseconds at which the current user data access expires.
     */
    dataAccessExpires: number;
    /**
     * The last time in milliseconds the `token` was refreshed (or when it was first obtained).
     */
    refresh?: number;
    /**
     * Android: Indicates how this `token` was obtained.
     */
    tokenSource?: string;
    /**
     * A valid raw signed request as a string.
     */
    signedRequest?: string;
    /**
     * A website domain within the Graph API.
     * https://developers.facebook.com/docs/graph-api/reference/v5.0/domain
     */
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
