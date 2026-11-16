// @docsMissing
export type StatusBarStyle = 'auto' | 'inverted' | 'light' | 'dark';

// @docsMissing
export type StatusBarAnimation = 'none' | 'fade' | 'slide';

// @needsAudit
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
   * If the status bar is hidden. Has no effect on iPhone Duo, where the status bar is in a
   * vertical bar. Use `verticalBarBehaviorIOS` to move it back to the top.
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
   * Whether the system may move the status bar into a vertical bar beside the content, as on
   * iPhone Duo. `'disabled'` keeps the status bar and system bars horizontal while this component
   * is mounted. When several mounted `StatusBar` components set this prop, the most recently
   * mounted one applies. Requires iOS 27.1 or later.
   * @default 'automatic'
   * @platform ios
   */
  verticalBarBehaviorIOS?: VerticalBarBehaviorIOS;
};

/**
 * The edge where the system places the vertical bar, which holds the status bar beside the
 * content on devices such as iPhone Duo.
 * @platform ios
 */
export type VerticalBarEdgeIOS = 'leading' | 'trailing';

/**
 * Whether the system may place the status bar in a vertical bar. `'disabled'` keeps the status
 * bar and system bars horizontal.
 * @platform ios
 */
export type VerticalBarBehaviorIOS = 'automatic' | 'disabled';
