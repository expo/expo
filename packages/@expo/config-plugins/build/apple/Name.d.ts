import { ExpoConfig } from '@expo/config-types';
import { XcodeProject } from 'xcode';
import { InfoPlist } from './AppleConfig.types';
import { ConfigPlugin } from '../Plugin.types';
export declare const withDisplayName: (applePlatform: 'ios' | 'macos') => ConfigPlugin;
export declare const withName: (applePlatform: 'ios' | 'macos') => ConfigPlugin;
/** Set the PRODUCT_NAME variable in the xcproj file based on the app.json name property. */
export declare const withProductName: (applePlatform: 'ios' | 'macos') => ConfigPlugin;
export declare function getName(config: Pick<ExpoConfig, 'name'>): string | null;
/**
 * CFBundleDisplayName is used for most things: the name on the home screen, in
 * notifications, and others.
 */
export declare function setDisplayName(configOrName: Pick<ExpoConfig, 'name'> | string, { CFBundleDisplayName, ...infoPlist }: InfoPlist): InfoPlist;
/**
 * CFBundleName is recommended to be 16 chars or less and is used in lists, eg:
 * sometimes on the App Store
 */
export declare function setName(config: Pick<ExpoConfig, 'name'>, { CFBundleName, ...infoPlist }: InfoPlist): InfoPlist;
export declare function setProductName(config: Pick<ExpoConfig, 'name'>, project: XcodeProject): XcodeProject;
