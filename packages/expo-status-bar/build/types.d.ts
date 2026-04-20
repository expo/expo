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
     * animated. Supported for `style` and `hidden`.
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
};
//# sourceMappingURL=types.d.ts.map