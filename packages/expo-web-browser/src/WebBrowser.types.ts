export type RedirectEvent = {
  url: string;
};

export type WebBrowserOpenOptions = {
  toolbarColor?: string;
  browserPackage?: string;
  enableBarCollapsing?: boolean;
  showTitle?: boolean;

  /** Android only */
  showInRecents?: boolean;

  /** iOS only */
  controlsColor?: string;

  // Web
  windowName?: string;
  windowFeatures?: string;
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
