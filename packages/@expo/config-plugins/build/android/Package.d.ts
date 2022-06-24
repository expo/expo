import { ExpoConfig } from '@expo/config-types';
import { ConfigPlugin } from '../Plugin.types';
import { AndroidManifest } from './Manifest';
export declare const withPackageManifest: ConfigPlugin<void>;
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
export declare function setPackageInAndroidManifest(config: Pick<ExpoConfig, 'android'>, androidManifest: AndroidManifest): AndroidManifest;
export declare function getApplicationIdAsync(projectRoot: string): Promise<string | null>;
