import { ExpoConfig } from '@expo/config-types';
import { XcodeProject } from 'xcode';
import { ConfigPlugin } from '../Plugin.types';
export declare const withDeviceFamily: (applePlatform: 'ios' | 'macos') => ConfigPlugin;
export declare function getSupportsTablet(applePlatform: 'ios' | 'macos', config: Pick<ExpoConfig, typeof applePlatform>): boolean;
export declare function getIsTabletOnly(applePlatform: 'ios' | 'macos', config: Pick<ExpoConfig, typeof applePlatform>): boolean;
export declare function getDeviceFamilies(applePlatform: 'ios' | 'macos', config: Pick<ExpoConfig, typeof applePlatform>): number[];
/**
 * Wrapping the families in double quotes is the only way to set a value with a comma in it.
 *
 * @param deviceFamilies
 */
export declare function formatDeviceFamilies(deviceFamilies: number[]): string;
/**
 * Add to pbxproj under TARGETED_DEVICE_FAMILY
 */
export declare function setDeviceFamily(applePlatform: 'ios' | 'macos', config: Pick<ExpoConfig, typeof applePlatform>, { project }: {
    project: XcodeProject;
}): XcodeProject;
