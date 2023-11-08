export interface LaunchBrowserInstance {
  close: () => Promise<void>;
}

/**
 * Supported browser types enum
 */
export const LaunchBrowserTypesEnum = {
  CHROME: 'Google Chrome',
  EDGE: 'Microsoft Edge',
  BRAVE: 'Brave',
} as const;

/**
 * Supported browser types
 */
export type LaunchBrowserTypes =
  (typeof LaunchBrowserTypesEnum)[keyof typeof LaunchBrowserTypesEnum];

/**
 * A browser launcher
 */
export interface LaunchBrowser {
  /**
   * Return whether the given `browserType` is supported
   */
  isSupportedBrowser: (browserType: LaunchBrowserTypes) => Promise<boolean>;

  /**
   * Create temp directory for browser profile
   *
   * @param baseDirName The base directory name for the created directory
   */
  createTempBrowserDir: (baseDirName: string) => Promise<string>;

  /**
   * Launch the browser
   */
  launchAsync: (browserType: LaunchBrowserTypes, args: string[]) => Promise<LaunchBrowserInstance>;

  /**
   * Close current browser instance
   */
  close: () => Promise<void>;
}
