export declare type StatusBarStyle = 'auto' | 'inverted' | 'light' | 'dark';
export declare type StatusBarAnimation = 'none' | 'fade' | 'slide';
export declare type StatusBarProps = {
    /**
     * Sets the color of the status bar text. Default value is "auto" which
     * picks the appropriate value according to the active color scheme, eg:
     * if your app is dark mode, the style will be "light".
     */
    style?: StatusBarStyle;
    /**
     * If the transition between status bar property changes should be
     * animated. Supported for backgroundColor, barStyle and hidden.
     */
    animated?: boolean;
    /**
     * If the status bar is hidden.
     */
    hidden?: boolean;
    /**
     * The transition effect when showing and hiding the status bar using
     * the hidden prop. Defaults to 'fade'.
     *
     * @platform ios
     */
    hideTransitionAnimation?: StatusBarAnimation;
    /**
     * If the network activity indicator should be visible.
     *
     * @platform ios
     */
    networkActivityIndicatorVisible?: boolean;
    /**
     * The background color of the status bar.
     *
     * @platform android
     */
    backgroundColor?: string;
    /**
     * If the status bar is translucent. When translucent is set to true,
     * the app will draw under the status bar. This is the default in
     * projects created with Expo tools because it is consistent with iOS.
     *
     * @platform android
     */
    translucent?: boolean;
};
