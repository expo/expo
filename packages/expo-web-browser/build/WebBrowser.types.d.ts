export type RedirectEvent = {
    url: string;
};
export type WebBrowserWindowFeatures = Record<string, number | boolean | string>;
export type WebBrowserOpenOptions = {
    /**
     * Color of the toolbar. Supports React Native [color formats](https://reactnative.dev/docs/colors).
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
     * Color of the secondary toolbar. Supports React Native [color formats](https://reactnative.dev/docs/colors).
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
     * Tint color for controls in SKSafariViewController. Supports React Native [color formats](https://reactnative.dev/docs/colors).
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
     * The [presentation style](https://developer.apple.com/documentation/uikit/uiviewcontroller/1621355-modalpresentationstyle)
     * of the browser window.
     * @default WebBrowser.WebBrowserPresentationStyle.OverFullScreen
     * @platform ios
     */
    presentationStyle?: WebBrowserPresentationStyle;
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
/**
 * If there is no native AuthSession implementation available (which is the case on Android) the params inherited from
 * [`WebBrowserOpenOptions`](#webbrowseropenoptions) will be used in the browser polyfill. Otherwise, the browser parameters will be ignored.
 */
export type AuthSessionOpenOptions = WebBrowserOpenOptions & {
    /**
     * Determines whether the session should ask the browser for a private authentication session.
     * Set this to `true` to request that the browser doesn’t share cookies or other browsing data between the authentication session and the user’s normal browser session.
     * Whether the request is honored depends on the user’s default web browser.
     *
     * @default false
     * @platform ios
     */
    preferEphemeralSession?: boolean;
};
export type WebBrowserAuthSessionResult = WebBrowserRedirectResult | WebBrowserResult;
export type WebBrowserCustomTabsResults = {
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
/**
 * A browser presentation style. Its values are directly mapped to the [`UIModalPresentationStyle`](https://developer.apple.com/documentation/uikit/uiviewcontroller/1621355-modalpresentationstyle).
 *
 * @platform ios
 */
export declare enum WebBrowserPresentationStyle {
    /**
     * A presentation style in which the presented browser covers the screen.
     */
    FULL_SCREEN = "fullScreen",
    /**
     * A presentation style that partially covers the underlying content.
     */
    PAGE_SHEET = "pageSheet",
    /**
     * A presentation style that displays the browser centered in the screen.
     */
    FORM_SHEET = "formSheet",
    /**
     * A presentation style where the browser is displayed over the app's content.
     */
    CURRENT_CONTEXT = "currentContext",
    /**
     * A presentation style in which the browser view covers the screen.
     */
    OVER_FULL_SCREEN = "overFullScreen",
    /**
     * A presentation style where the browser is displayed over the app's content.
     */
    OVER_CURRENT_CONTEXT = "overCurrentContext",
    /**
     * A presentation style where the browser is displayed in a popover view.
     */
    POPOVER = "popover",
    /**
     * The default presentation style chosen by the system.
     * On older iOS versions, falls back to `WebBrowserPresentationStyle.FullScreen`.
     *
     * @platform ios
     */
    AUTOMATIC = "automatic"
}
export type WebBrowserResult = {
    /**
     * Type of the result.
     */
    type: WebBrowserResultType;
};
export type WebBrowserRedirectResult = {
    /**
     * Type of the result.
     */
    type: 'success';
    url: string;
};
export type ServiceActionResult = {
    servicePackage?: string;
};
export type WebBrowserMayInitWithUrlResult = ServiceActionResult;
export type WebBrowserWarmUpResult = ServiceActionResult;
export type WebBrowserCoolDownResult = ServiceActionResult;
export type WebBrowserCompleteAuthSessionOptions = {
    /**
     * Attempt to close the window without checking to see if the auth redirect matches the cached redirect URL.
     */
    skipRedirectCheck?: boolean;
};
export type WebBrowserCompleteAuthSessionResult = {
    /**
     * Type of the result.
     */
    type: 'success' | 'failed';
    /**
     * Additional description or reasoning of the result.
     */
    message: string;
};
//# sourceMappingURL=WebBrowser.types.d.ts.map