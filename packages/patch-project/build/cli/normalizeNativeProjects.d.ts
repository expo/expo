import { type ModPlatform } from 'expo/config-plugins';
import type { WorkingDirectories } from './workingDirectories';
interface Params {
    projectRoot: string;
    workingDirectories: WorkingDirectories;
    platform: ModPlatform;
    backup: boolean;
}
type BackupFileMappings = Record<string, string>;
/**
 * Normalize the native projects to minimize the diff between prebuilds.
 */
export declare function normalizeNativeProjectsAsync(params: Params): Promise<BackupFileMappings>;
/**
 * Revert the changes made by `normalizeNativeProjectsAsync()`.
 */
export declare function revertNormalizeNativeProjectsAsync(backupFileMappings: BackupFileMappings): Promise<void>;
export {};
