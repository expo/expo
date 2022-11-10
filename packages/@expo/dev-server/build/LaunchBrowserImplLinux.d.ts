import { LaunchBrowserTypes, type LaunchBrowserImpl, type LaunchBrowserInstance } from './LaunchBrowser.types';
/**
 * Browser implementation for Linux
 */
export default class LaunchBrowserImplLinux implements LaunchBrowserImpl, LaunchBrowserInstance {
    private _appId;
    private _process;
    MAP: {
        0: string[];
        1: string[];
    };
    /**
     * On Linux, the supported appId is an array, this function finds the available appId and caches it
     */
    private getAppId;
    isSupportedBrowser(browserType: LaunchBrowserTypes): Promise<boolean>;
    createTempBrowserDir(baseDirName: string): Promise<string>;
    launchAsync(browserType: LaunchBrowserTypes, args: string[]): Promise<LaunchBrowserInstance>;
    close(): Promise<void>;
}
