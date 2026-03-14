export type StatusBarStyle = 'auto' | 'inverted' | 'light' | 'dark';
export type StatusBarAnimation = 'none' | 'fade' | 'slide';
export type StatusBarProps = {
    /**
     * Sets the color of the status bar text. Default value is `"auto"` which
     * picks the appropriate value according to the active color scheme, eg:
     * if your app is dark mode, the style will be `"light"`.
     * @default 'auto'
     */
    style?: StatusBarStyle;
    /**
     * If the transition between status bar property changes should be
     * animated. Supported for `backgroundColor`, `barStyle` and `hidden`.
     */
    animated?: boolean;
    /**
     * If the status bar is hidden.
     */
    hidden?: boolean;
    /**
     * The transition effect when showing and hiding the status bar using
     * the hidden prop.
     * @default 'fade'
     * @platform ios
     */
    hideTransitionAnimation?: StatusBarAnimation;
    /**
     * If the network activity indicator should be visible.
     * @platform ios
     * @deprecated The status bar network activity indicator is not supported in iOS 13 and later. This will be removed in a future release.
     */
    networkActivityIndicatorVisible?: boolean;
    /**
     * The background color of the status bar.
     * @platform android
     * @deprecated Due to Android edge-to-edge enforcement, setting the status bar background color is deprecated and has no effect. This will be removed in a future release.
     */
    backgroundColor?: string;
    /**
     * If the status bar is translucent. When translucent is set to `true`,
     * the app will draw under the status bar. This is the default behaviour in
     * projects created with Expo tools because it is consistent with iOS.
     * @platform android
     * @deprecated Due to Android edge-to-edge enforcement, setting the status bar as translucent is deprecated and has no effect. This will be removed in a future release.
     */
    translucent?: boolean;
};
//# sourceMappingURL=types.d.ts.map