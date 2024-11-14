import { type ModPlatform } from 'expo/config-plugins';
/**
 * Entry point into the patch-project process.
 */
export declare function patchProjectAsync(projectRoot: string, options: {
    /** List of platforms to prebuild. */
    platforms: ModPlatform[];
    /** Should delete the native folders after attempting to prebuild. @default false */
    clean?: boolean;
    /** URL or file path to the prebuild template. */
    template?: string;
    /** The options to pass to the `git diff` command. */
    diffOptions?: string[];
    /** The directory to save the patch files. @default `cng-patches` */
    patchRoot?: string;
}): Promise<void>;
