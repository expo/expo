import { LaunchBrowserTypes, type LaunchBrowserImpl, type LaunchBrowserInstance } from './LaunchBrowser.types';
/**
 * Browser implementation for Windows and WSL
 *
 * To minimize the difference between Windows and WSL, the implementation wraps all spawn calls through powershell.
 */
export default class LaunchBrowserImplWindows implements LaunchBrowserImpl, LaunchBrowserInstance {
    private _appId;
    MAP: {
        0: {
            appId: string;
            fullName: string;
        };
        1: {
            appId: string;
            fullName: string;
        };
    };
    isSupportedBrowser(browserType: LaunchBrowserTypes): Promise<boolean>;
    createTempBrowserDir(baseDirName: string): Promise<string>;
    launchAsync(browserType: LaunchBrowserTypes, args: string[]): Promise<LaunchBrowserInstance>;
    close(): Promise<void>;
}
