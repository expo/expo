import { LaunchBrowserTypes, type LaunchBrowserImpl, type LaunchBrowserInstance } from './LaunchBrowser.types';
/**
 * Browser implementation for macOS
 */
export default class LaunchBrowserImplMacOS implements LaunchBrowserImpl, LaunchBrowserInstance {
    private _process;
    MAP: {
        0: string;
        1: string;
    };
    isSupportedBrowser(browserType: LaunchBrowserTypes): Promise<boolean>;
    createTempBrowserDir(baseDirName: string): Promise<string>;
    launchAsync(browserType: LaunchBrowserTypes, args: string[]): Promise<LaunchBrowserInstance>;
    close(): Promise<void>;
}
