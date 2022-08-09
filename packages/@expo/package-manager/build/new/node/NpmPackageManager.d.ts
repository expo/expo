import { BasePackageManager } from './BasePackageManager';
export declare class NpmPackageManager extends BasePackageManager {
    readonly name = "npm";
    readonly bin = "npm";
    readonly lockFile = "package-lock.json";
    addAsync(namesOrFlags?: string[]): Promise<void>;
    addDevAsync(namesOrFlags?: string[]): Promise<void>;
    addGlobalAsync(namesOrFlags?: string[]): Promise<void>;
    removeAsync(namesOrFlags: string[]): Promise<void>;
    removeDevAsync(namesOrFlags: string[]): Promise<void>;
    removeGlobalAsync(namesOrFlags: string[]): Promise<void>;
    /**
     * Parse all package specifications from the names or flag list.
     * The result from this method can be used for `.updatePackageFileAsync`.
     */
    private parsePackageSpecs;
    /**
     * Older npm versions have issues with mismatched nested dependencies when adding exact versions.
     * This propagates as issues like mismatched `@expo/config-pugins` versions.
     * As a workaround, we update the `package.json` directly and run `npm install`.
     */
    private updatePackageFileAsync;
}
