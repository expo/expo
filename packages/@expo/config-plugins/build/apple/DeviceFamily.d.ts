import { ExpoConfig } from '@expo/config-types';
import { XcodeProject } from 'xcode';
import { ConfigPlugin } from '../Plugin.types';
export declare const withDeviceFamily: (applePlatform: 'ios' | 'macos') => ConfigPlugin;
export declare const getSupportsTablet: (applePlatform: 'ios' | 'macos') => (config: Pick<ExpoConfig, "ios" | "macos">) => boolean;
export declare const getIsTabletOnly: (applePlatform: 'ios' | 'macos') => (config: Pick<ExpoConfig, "ios" | "macos">) => boolean;
export declare const getDeviceFamilies: (applePlatform: 'ios' | 'macos') => (config: Pick<ExpoConfig, "ios" | "macos">) => number[];
/**
 * Wrapping the families in double quotes is the only way to set a value with a comma in it.
 *
 * @param deviceFamilies
 */
export declare function formatDeviceFamilies(deviceFamilies: number[]): string;
/**
 * Add to pbxproj under TARGETED_DEVICE_FAMILY
 */
export declare const setDeviceFamily: (applePlatform: 'ios' | 'macos') => (config: Pick<ExpoConfig, "ios" | "macos">, { project }: {
    project: XcodeProject;
}) => XcodeProject;
