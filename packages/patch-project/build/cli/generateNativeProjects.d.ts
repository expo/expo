import { type ExpoConfig } from 'expo/config';
import { type ModPlatform } from 'expo/config-plugins';
/**
 * Generates native projects for the given platforms.
 * This step is similar to the `expo prebuild` command but removes some validation.
 * @return The checksum of the template used to generate the native projects.
 */
export declare function generateNativeProjectsAsync(projectRoot: string, exp: ExpoConfig, options: {
    /** List of platforms to prebuild. */
    platforms: ModPlatform[];
    /** URL or file path to the prebuild template. */
    template?: string;
    /** Directory to write the template to before copying into the project. */
    templateDirectory: string;
}): Promise<string>;
/**
 * Sanity check for the native project before attempting to run patch-project.
 */
export declare function platformSanityCheckAsync({ exp, projectRoot, platform, }: {
    exp: ExpoConfig;
    projectRoot: string;
    platform: ModPlatform;
}): Promise<void>;
