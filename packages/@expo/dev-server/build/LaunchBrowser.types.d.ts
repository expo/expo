export interface LaunchBrowserInstance {
    close: () => Promise<void>;
}
/**
 * Supported browser types
 */
export declare enum LaunchBrowserTypes {
    CHROME = 0,
    EDGE = 1
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
