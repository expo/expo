import { ModPlatform, StaticPlugin } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
/**
 * Returns a list of packages that are autolinked to a project.
 *
 * @param projectRoot
 * @param platforms platforms to check for
 * @returns list of packages ex: `['expo-camera', 'react-native-screens']`
 */
export declare function getAutolinkedPackagesAsync(projectRoot: string, platforms?: ModPlatform[]): Promise<string[]>;
export declare function resolvePackagesList(platformPaths: Record<string, any>[]): string[];
export declare function shouldSkipAutoPlugin(config: Pick<ExpoConfig, '_internal'>, plugin: StaticPlugin | string): boolean;
