import type { ProjectConfig } from 'expo/config';
import { type NormalizedOptions } from './Fingerprint.types';
/**
 * An out-of-process `expo/config` loader that can be used to get the Expo config and loaded modules.
 */
export declare function getExpoConfigAsync(projectRoot: string, options: NormalizedOptions): Promise<{
    config: ProjectConfig | null;
    loadedModules: string[] | null;
}>;
