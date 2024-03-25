// @needsAudit @docsMissing
export var WebBrowserResultType;
(function (WebBrowserResultType) {
    /**
     * @platform ios
     */
    WebBrowserResultType["CANCEL"] = "cancel";
    /**
     * @platform ios
     */
    WebBrowserResultType["DISMISS"] = "dismiss";
    /**
     * @platform android
     */
    WebBrowserResultType["OPENED"] = "opened";
    WebBrowserResultType["LOCKED"] = "locked";
})(WebBrowserResultType || (WebBrowserResultType = {}));
// @needsAudit
/**
 * A browser presentation style. Its values are directly mapped to the [`UIModalPresentationStyle`](https://developer.apple.com/documentation/uikit/uiviewcontroller/1621355-modalpresentationstyle).
 *
 * @platform ios
 */
export var WebBrowserPresentationStyle;
(function (WebBrowserPresentationStyle) {
    /**
     * A presentation style in which the presented browser covers the screen.
     */
    WebBrowserPresentationStyle["FULL_SCREEN"] = "fullScreen";
    /**
     * A presentation style that partially covers the underlying content.
     */
    WebBrowserPresentationStyle["PAGE_SHEET"] = "pageSheet";
    /**
     * A presentation style that displays the browser centered in the screen.
     */
    WebBrowserPresentationStyle["FORM_SHEET"] = "formSheet";
    /**
     * A presentation style where the browser is displayed over the app's content.
     */
    WebBrowserPresentationStyle["CURRENT_CONTEXT"] = "currentContext";
    /**
     * A presentation style in which the browser view covers the screen.
     */
    WebBrowserPresentationStyle["OVER_FULL_SCREEN"] = "overFullScreen";
    /**
     * A presentation style where the browser is displayed over the app's content.
     */
    WebBrowserPresentationStyle["OVER_CURRENT_CONTEXT"] = "overCurrentContext";
    /**
     * A presentation style where the browser is displayed in a popover view.
     */
    WebBrowserPresentationStyle["POPOVER"] = "popover";
    /**
     * The default presentation style chosen by the system.
     * On older iOS versions, falls back to `WebBrowserPresentationStyle.FullScreen`.
     *
     * @platform ios
     */
    WebBrowserPresentationStyle["AUTOMATIC"] = "automatic";
})(WebBrowserPresentationStyle || (WebBrowserPresentationStyle = {}));
//# sourceMappingURL=WebBrowser.types.js.map