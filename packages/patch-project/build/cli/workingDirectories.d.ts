import { type ModPlatform } from 'expo/config-plugins';
export interface WorkingDirectories {
    /** Root directory for all the working directories */
    rootDir: string;
    /** Temporary directory to save template files before copying native projects. */
    templateDir: string;
    /** The temporary Git repository to generate diffs. */
    diffDir: string;
    /** The temporary directory to save the original native projects. */
    originDir: string;
    /** The temporary directory to save the misc files. */
    tmpDir: string;
}
/**
 * Create working directories for the patch-project process.
 */
export declare function createWorkingDirectoriesAsync(projectRoot: string, platform: ModPlatform): Promise<WorkingDirectories>;
export declare function ensureAsync(path: string): Promise<string>;
