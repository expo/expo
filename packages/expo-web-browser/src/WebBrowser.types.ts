export type RedirectEvent = {
  url: string;
};

export type OpenBrowserOptions = {
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

export type AuthSessionResult = RedirectResult | BrowserResult;

export type CustomTabsBrowsersResults = {
  defaultBrowserPackage?: string;
  preferredBrowserPackage?: string;
  browserPackages: string[];
  servicePackages: string[];
};

export type BrowserResult = {
  // cancel and dismiss are iOS only, opened is Android only
  type: 'cancel' | 'dismiss' | 'opened';
};

export type RedirectResult = {
  type: 'success';
  url: string;
};

export type ServiceActionResult = {
  servicePackage?: string;
};

export type MayInitWithUrlResult = ServiceActionResult;
export type WarmUpResult = ServiceActionResult;
export type CoolDownResult = ServiceActionResult;
