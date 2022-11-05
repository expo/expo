export interface BrowserInstance {
    close: () => Promise<void>;
}
/**
 * Launch a browser for JavaScript inspector
 */
export declare function launchBrowserAsync(url: string): Promise<BrowserInstance>;
