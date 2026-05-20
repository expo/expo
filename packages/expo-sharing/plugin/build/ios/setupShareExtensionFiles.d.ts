import { ActivationRule } from '../sharingPlugin.types';
export type ProjectFiles = {
    swiftFiles: string[];
    entitlementFiles: string[];
    plistFiles: string[];
    assetDirectories: string[];
    intentFiles: string[];
    otherFiles: string[];
};
export type ShareExtensionFiles = ProjectFiles & {
    sharedFiles: ProjectFiles | null;
};
/**
 * Copies the template files into the native project directory and prepares the extension entitlements file.
 * @returns Object storing categorized copied files.
 * Note @behenate: This doesn't support nested folders as of now, we don't need this, so I didn't bother adding it.
 */
export declare function setupShareExtensionFiles(targetPath: string, extensionTargetName: string, appGroupId: string, urlScheme: string, activationRule: ActivationRule): ShareExtensionFiles;
export declare function parseDirectoryFiles(directoryPath: string): ProjectFiles;
export declare function copyFileSync(source: string, target: string): void;
