import { ExpoConfig } from '@expo/config-types';
import { ConfigPlugin } from '../Plugin.types';
export declare const withPackageGradle: ConfigPlugin;
export declare const withPackageRefactor: ConfigPlugin;
export declare function getPackage(config: Pick<ExpoConfig, 'android'>): string | null;
export declare function renamePackageOnDisk(config: Pick<ExpoConfig, 'android'>, projectRoot: string): Promise<void>;
export declare function renameJniOnDiskForType({ projectRoot, type, packageName, }: {
    projectRoot: string;
    type: string;
    packageName: string;
}): Promise<void>;
export declare function renamePackageOnDiskForType({ projectRoot, type, packageName, }: {
    projectRoot: string;
    type: string;
    packageName: string;
}): Promise<void>;
export declare function setPackageInBuildGradle(config: Pick<ExpoConfig, 'android'>, buildGradle: string): string;
export declare function getApplicationIdAsync(projectRoot: string): Promise<string | null>;
/**
 * Make a package name safe to use in a kotlin file,
 * e.g. is.pvin.hello -> `is`.pvin.hello
 */
export declare function kotlinSanitized(packageName: string): string;
