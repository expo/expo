import { LaunchBrowserTypes, type LaunchBrowserImpl, type LaunchBrowserInstance } from './LaunchBrowser.types';
/**
 * Browser implementation for Windows and WSL
 *
 * To minimize the difference between Windows and WSL, the implementation wraps all spawn calls through powershell.
 */
export default class LaunchBrowserImplWindows implements LaunchBrowserImpl, LaunchBrowserInstance {
    private _appId;
    private _powershellEnv;
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
    /**
     * This method is used to get the powershell environment variables for `Get-Package` command.
     * Especially for powershell 7, its default `PSModulePath` is different from powershell 5 and `Get-Package` command is not available.
     * We need to set the PSModulePath to include the default value of powershell 5.
     */
    private getPowershellEnv;
}
