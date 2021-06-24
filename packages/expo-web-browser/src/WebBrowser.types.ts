export type RedirectEvent = {
  url: string;
};

// @needsAudit @docsMissing
export type WebBrowserWindowFeatures = Record<string, number | boolean | string>;

// @needsAudit
export type WebBrowserOpenOptions = {
  /**
   * Color of the toolbar in either `#AARRGGBB` or `#RRGGBB` format.
   */
  toolbarColor?: string;
  /**
   * __(Android only)__. Package name of a browser to be used to handle Custom Tabs. List of
   * available packages is to be queried by [`getCustomTabsSupportingBrowsers`](#webbrowsergetcustomtabssupportingbrowsersasync) method.
   */
  browserPackage?: string;
  /**
   * A boolean determining whether the toolbar should be hiding when a user scrolls the website.
   */
  enableBarCollapsing?: boolean;
  /**
   * __(Android only)__ Color of the secondary toolbar in either `#AARRGGBB` or `#RRGGBB` format.
   */
  secondaryToolbarColor?: string;
  /**
   * __(Android only)__ A boolean determining whether the browser should show the title of website on the toolbar.
   */
  showTitle?: boolean;
  /**
   * __(Android only)__ A boolean determining whether a default share item should be added to the menu.
   */
  enableDefaultShareMenuItem?: boolean;
  /**
   * __(Android only)__ A boolean determining whether browsed website should be shown as separate
   * entry in Android recents/multitasking view. Requires `createTask` to be `true` (default).
   * @default `false`
   */
  showInRecents?: boolean;
  /**
   * __(Android only)__ A boolean determining whether the browser should open in a new task or in
   * the same task as your app.
   * @default `true`
   */
  createTask?: boolean;
  /**
   * __(iOS only)__ Tint color for controls in SKSafariViewController in `#AARRGGBB` or `#RRGGBB` format.
   */
  controlsColor?: string;
  /**
   * __(iOS only)__ The style of the dismiss button. Should be one of: `done`, `close`, or `cancel`.
   */
  dismissButtonStyle?: 'done' | 'close' | 'cancel';
  /**
   * __(iOS only)__ A boolean determining whether Safari should enter Reader mode, if it is available.
   */
  readerMode?: boolean;
  /**
   * __(Web only)__ Name to assign to the popup window.
   */
  windowName?: string;
  /**
   * __(Web only)__ Features to use with `window.open()`.
   */
  windowFeatures?: string | WebBrowserWindowFeatures;
};

export type WebBrowserAuthSessionResult = WebBrowserRedirectResult | WebBrowserResult;

// @needsAudit
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

// @needsAudit @docsMissing
export enum WebBrowserResultType {
  /**
   * iOS only.
   */
  CANCEL = 'cancel',
  /**
   * iOS only.
   */
  DISMISS = 'dismiss',
  /**
   * Android only.
   */
  OPENED = 'opened',
  LOCKED = 'locked',
}

// @needsAudit
export type WebBrowserResult = {
  /**
   * Type of the result.
   */
  type: WebBrowserResultType;
};

// @needsAudit @docsMissing
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

// @needsAudit
export type WebBrowserCompleteAuthSessionOptions = {
  /**
   * Attempt to close the window without checking to see if the auth redirect matches the cached redirect URL.
   */
  skipRedirectCheck?: boolean;
};

// @needsAudit
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
