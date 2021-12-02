export declare type RedirectEvent = {
    url: string;
};
export declare type WebBrowserWindowFeatures = Record<string, number | boolean | string>;
export declare type WebBrowserOpenOptions = {
    /**
     * Color of the toolbar in either `#AARRGGBB` or `#RRGGBB` format.
     */
    toolbarColor?: string;
    /**
     * Package name of a browser to be used to handle Custom Tabs. List of
     * available packages is to be queried by [`getCustomTabsSupportingBrowsers`](#webbrowsergetcustomtabssupportingbrowsersasync) method.
     * @platform android
     */
    browserPackage?: string;
    /**
     * A boolean determining whether the toolbar should be hiding when a user scrolls the website.
     */
    enableBarCollapsing?: boolean;
    /**
     * Color of the secondary toolbar in either `#AARRGGBB` or `#RRGGBB` format.
     * @platform android
     */
    secondaryToolbarColor?: string;
    /**
     * A boolean determining whether the browser should show the title of website on the toolbar.
     * @platform android
     */
    showTitle?: boolean;
    /**
     * A boolean determining whether a default share item should be added to the menu.
     * @platform android
     */
    enableDefaultShareMenuItem?: boolean;
    /**
     * A boolean determining whether browsed website should be shown as separate
     * entry in Android recents/multitasking view. Requires `createTask` to be `true` (default).
     * @default false
     * @platform android
     */
    showInRecents?: boolean;
    /**
     * A boolean determining whether the browser should open in a new task or in
     * the same task as your app.
     * @default true
     * @platform android
     */
    createTask?: boolean;
    /**
     * Tint color for controls in SKSafariViewController in `#AARRGGBB` or `#RRGGBB` format.
     * @platform ios
     */
    controlsColor?: string;
    /**
     * The style of the dismiss button. Should be one of: `done`, `close`, or `cancel`.
     * @platform ios
     */
    dismissButtonStyle?: 'done' | 'close' | 'cancel';
    /**
     * A boolean determining whether Safari should enter Reader mode, if it is available.
     * @platform ios
     */
    readerMode?: boolean;
    /**
     * Name to assign to the popup window.
     * @platform web
     */
    windowName?: string;
    /**
     * Features to use with `window.open()`.
     * @platform web
     */
    windowFeatures?: string | WebBrowserWindowFeatures;
};
export declare type WebBrowserAuthSessionResult = WebBrowserRedirectResult | WebBrowserResult;
export declare type WebBrowserCustomTabsResults = {
    /**
     * Default package chosen by user, `null` if there is no such packages. Also `null` usually means,
     * that user will be prompted to choose from available packages.
     */
    defaultBrowserPackage?: string;
    /**
     * Package preferred by `CustomTabsClient` to be used to handle Custom Tabs. It favors browser
     * chosen by user as default, as long as it is present on both `browserPackages` and
     * `servicePackages` lists. Only such browsers are considered as fully supporting Custom Tabs.
     * It might be `null` when there is no such browser installed or when default browser is not in
     * `servicePackages` list.
     */
    preferredBrowserPackage?: string;
    /**
     * All packages recognized by `PackageManager` as capable of handling Custom Tabs. Empty array
     * means there is no supporting browsers on device.
     */
    browserPackages: string[];
    /**
     * All packages recognized by `PackageManager` as capable of handling Custom Tabs Service.
     * This service is used by [`warmUpAsync`](#webbrowserwarmupasyncbrowserpackage), [`mayInitWithUrlAsync`](#webbrowsermayinitwithurlasyncurl-browserpackage)
     * and [`coolDownAsync`](#webbrowsercooldownasyncbrowserpackage).
     */
    servicePackages: string[];
};
export declare enum WebBrowserResultType {
    /**
     * @platform ios
     */
    CANCEL = "cancel",
    /**
     * @platform ios
     */
    DISMISS = "dismiss",
    /**
     * @platform android
     */
    OPENED = "opened",
    LOCKED = "locked"
}
export declare type WebBrowserResult = {
    /**
     * Type of the result.
     */
    type: WebBrowserResultType;
};
export declare type WebBrowserRedirectResult = {
    /**
     * Type of the result.
     */
    type: 'success';
    url: string;
};
export declare type ServiceActionResult = {
    servicePackage?: string;
};
export declare type WebBrowserMayInitWithUrlResult = ServiceActionResult;
export declare type WebBrowserWarmUpResult = ServiceActionResult;
export declare type WebBrowserCoolDownResult = ServiceActionResult;
export declare type WebBrowserCompleteAuthSessionOptions = {
    /**
     * Attempt to close the window without checking to see if the auth redirect matches the cached redirect URL.
     */
    skipRedirectCheck?: boolean;
};
export declare type WebBrowserCompleteAuthSessionResult = {
    /**
     * Type of the result.
     */
    type: 'success' | 'failed';
    /**
     * Additional description or reasoning of the result.
     */
    message: string;
};
