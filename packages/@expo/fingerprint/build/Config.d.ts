import type { Config } from './Fingerprint.types';
import { SourceSkips } from './sourcer/SourceSkips';
type NormalizedConfig = Config & {
    sourceSkips?: SourceSkips;
};
/**
 * Load the fingerprint.config.js from project root.
 * @param projectRoot The project root directory.
 * @param silent Whether to mute console logs when loading the config. This is useful for expo-updates integration and makes sure the JSON output is valid.
 * @returns The loaded config or null if no config file was found.
 */
export declare function loadConfigAsync(projectRoot: string, silent?: boolean): Promise<NormalizedConfig | null>;
/**
 * Normalize the sourceSkips from enum number or string array to a valid enum number.
 */
export declare function normalizeSourceSkips(sourceSkips: Config['sourceSkips']): SourceSkips;
export {};
