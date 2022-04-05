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
// @docsMissing
export var WebBrowserPresentationStyle;
(function (WebBrowserPresentationStyle) {
    WebBrowserPresentationStyle[WebBrowserPresentationStyle["FullScreen"] = 0] = "FullScreen";
    WebBrowserPresentationStyle[WebBrowserPresentationStyle["PageSheet"] = 1] = "PageSheet";
    WebBrowserPresentationStyle[WebBrowserPresentationStyle["FormSheet"] = 2] = "FormSheet";
    WebBrowserPresentationStyle[WebBrowserPresentationStyle["CurrentContext"] = 3] = "CurrentContext";
    WebBrowserPresentationStyle[WebBrowserPresentationStyle["OverFullScreen"] = 5] = "OverFullScreen";
    WebBrowserPresentationStyle[WebBrowserPresentationStyle["OverCurrentContext"] = 6] = "OverCurrentContext";
    WebBrowserPresentationStyle[WebBrowserPresentationStyle["Popover"] = 7] = "Popover";
    WebBrowserPresentationStyle[WebBrowserPresentationStyle["Automatic"] = -2] = "Automatic";
})(WebBrowserPresentationStyle || (WebBrowserPresentationStyle = {}));
//# sourceMappingURL=WebBrowser.types.js.map