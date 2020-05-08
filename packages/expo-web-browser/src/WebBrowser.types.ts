export type RedirectEvent = {
  url: string;
};

export type WebBrowserWindowFeatures = Record<string, number | boolean | string>;

export type WebBrowserOpenOptions = {
  /**
   * Color of the toolbar in either #AARRGGBB or #RRGGBB format.
   */
  toolbarColor?: string;
  browserPackage?: string;
  /**
   * Whether the toolbar should be hiding when a user scrolls the website.
   */
  enableBarCollapsing?: boolean;

  /** Android only */

  /**
   * Whether the browser should show the title of website on the toolbar.
   */
  showTitle?: boolean;
  enableDefaultShareMenuItem?: boolean;
  /**
   * Whether browsed website should be shown as separate entry in Android recents/multitasking view.
   * Default: `false`
   */
  showInRecents?: boolean;

  /** iOS only */
  controlsColor?: string;
  dismissButtonStyle?: 'done' | 'close' | 'cancel';
  readerMode?: boolean;

  /**
   * **Web:** name to assign to the popup window.
   */
  windowName?: string;
  /**
   * **Web:** features to use with `window.open()`
   */
  windowFeatures?: string | WebBrowserWindowFeatures;
};

export type WebBrowserAuthSessionResult = WebBrowserRedirectResult | WebBrowserResult;

export type WebBrowserCustomTabsResults = {
  defaultBrowserPackage?: string;
  preferredBrowserPackage?: string;
  browserPackages: string[];
  servicePackages: string[];
};

export const WebBrowserResultType = {
  /**
   * iOS only
   */
  CANCEL: 'cancel',
  /**
   * iOS only
   */
  DISMISS: 'dismiss',
  /**
   * Android only
   */
  OPENED: 'opened',
} as const;

export type WebBrowserResultType = typeof WebBrowserResultType[keyof typeof WebBrowserResultType];

export type WebBrowserResult = {
  // cancel and dismiss are iOS only, opened is Android only
  type: WebBrowserResultType;
};

export type WebBrowserRedirectResult = {
  type: 'success';
  url: string;
};

export type ServiceActionResult = {
  servicePackage?: string;
};

export type WebBrowserMayInitWithUrlResult = ServiceActionResult;
export type WebBrowserWarmUpResult = ServiceActionResult;
export type WebBrowserCoolDownResult = ServiceActionResult;
