import { ExpoConfig } from '@expo/config-types';
import { ConfigPlugin } from '../Plugin.types';
export declare const withVersion: ConfigPlugin;
/** Sets a numeric version for a value in the project.gradle buildscript.ext object to be at least the provided props.minVersion, if the existing value is greater then no change will be made. */
export declare const withBuildScriptExtMinimumVersion: ConfigPlugin<{
    name: string;
    minVersion: number;
}>;
export declare function setMinBuildScriptExtVersion(buildGradle: string, { name, minVersion }: {
    name: string;
    minVersion: number;
}): string;
export declare function getVersionName(config: Pick<ExpoConfig, 'version'>): string | null;
export declare function setVersionName(config: Pick<ExpoConfig, 'version'>, buildGradle: string): string;
export declare function getVersionCode(config: Pick<ExpoConfig, 'android'>): number;
export declare function setVersionCode(config: Pick<ExpoConfig, 'android'>, buildGradle: string): string;
