export interface LaunchBrowserInstance {
  close: () => Promise<void>;
}

/**
 * Supported browser types
 */
export enum LaunchBrowserTypes {
  CHROME,
  EDGE,
}

/**
 * Internal browser implementation constraints
 */
export interface LaunchBrowserImpl {
  /**
   * Return whether the given `browserType` is supported
   */
  isSupportedBrowser: (browserType: LaunchBrowserTypes) => Promise<boolean>;

  /**
   * Launch the browser
   */
  launchAsync: (browserType: LaunchBrowserTypes, args: string[]) => Promise<LaunchBrowserInstance>;

  /**
   * Close current browser instance
   */
  close: () => Promise<void>;
}
