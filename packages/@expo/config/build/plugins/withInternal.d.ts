import { ConfigPlugin } from '@expo/config-plugins';
import { ConfigFilePaths } from '../Config.types';
export declare const EXPO_DEBUG: boolean;
/**
 * Adds the _internal object.
 *
 * @param config
 * @param projectRoot
 */
export declare const withInternal: ConfigPlugin<{
    projectRoot: string;
    packageJsonPath?: string;
} & Partial<ConfigFilePaths>>;
