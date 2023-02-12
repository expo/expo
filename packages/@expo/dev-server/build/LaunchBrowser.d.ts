import { type LaunchBrowserInstance } from './LaunchBrowser.types';
export type { LaunchBrowserInstance };
/**
 * Launch a browser for JavaScript inspector
 */
export declare function launchBrowserAsync(url: string): Promise<LaunchBrowserInstance>;
