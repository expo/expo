import { ExpoConfig } from '@expo/config-types';
import { XcodeProject } from 'xcode';
import { ConfigPlugin } from '../Plugin.types';
export declare const withDeviceFamily: ConfigPlugin;
export declare function getSupportsTablet(config: Pick<ExpoConfig, 'ios'>): boolean;
export declare function getIsTabletOnly(config: Pick<ExpoConfig, 'ios'>): boolean;
export declare function getDeviceFamilies(config: Pick<ExpoConfig, 'ios'>): number[];
/**
 * Wrapping the families in double quotes is the only way to set a value with a comma in it.
 *
 * @param deviceFamilies
 */
export declare function formatDeviceFamilies(deviceFamilies: number[]): string;
/**
 * Add to pbxproj under TARGETED_DEVICE_FAMILY
 */
export declare function setDeviceFamily(config: Pick<ExpoConfig, 'ios'>, { project }: {
    project: XcodeProject;
}): XcodeProject;
