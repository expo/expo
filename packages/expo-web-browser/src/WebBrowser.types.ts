export type RedirectEvent = {
  url: string;
};

export type OpenBrowserParams = {
  toolbarColor?: string;
  browserPackage?: string;
  enableBarCollapsing?: boolean;
  showTitle?: boolean;

  // Web
  target?: string;
  features?: string;
  replace?: boolean;
};

export type AuthSessionResult = RedirectResult | BrowserResult;

export type CustomTabsBrowsersResults = {
  defaultBrowserPackage?: string;
  preferredBrowserPackage?: string;
  browserPackages: string[];
  servicePackages: string[];
};

export type BrowserResult = {
  type: 'cancel' | 'dismiss';
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
