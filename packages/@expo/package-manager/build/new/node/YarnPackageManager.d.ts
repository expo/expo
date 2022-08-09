import { BasePackageManager } from './BasePackageManager';
export declare class YarnPackageManager extends BasePackageManager {
    readonly name = "yarn";
    readonly bin = "yarnpkg";
    readonly lockFile = "yarn.lock";
    /** Check if Yarn is running in offline mode, and add the `--offline` flag */
    private withOfflineFlagAsync;
    installAsync(flags?: string[]): Promise<void>;
    addAsync(namesOrFlags?: string[]): Promise<void>;
    addDevAsync(namesOrFlags?: string[]): Promise<void>;
    addGlobalAsync(namesOrFlags?: string[]): Promise<void>;
    removeAsync(namesOrFlags: string[]): Promise<void>;
    removeDevAsync(namesOrFlags: string[]): Promise<void>;
    removeGlobalAsync(namesOrFlags: string[]): Promise<void>;
}
