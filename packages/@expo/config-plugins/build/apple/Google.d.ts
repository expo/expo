import { ExpoConfig } from '@expo/config-types';
import { XcodeProject } from 'xcode';
import { InfoPlist } from './AppleConfig.types';
import { ConfigPlugin, ModProps } from '../Plugin.types';
export declare const withGoogle: (applePlatform: 'ios' | 'macos') => ConfigPlugin;
export declare const withGoogleServicesFile: (applePlatform: 'ios' | 'macos') => ConfigPlugin;
export declare const getGoogleSignInReversedClientId: (applePlatform: 'ios' | 'macos') => (config: Pick<ExpoConfig, "ios" | "macos">, modRequest: Pick<ModProps<InfoPlist>, 'projectRoot'>) => string | null;
export declare const getGoogleServicesFile: (applePlatform: 'ios' | 'macos') => (config: Pick<ExpoConfig, "ios" | "macos">) => string | null;
export declare const setGoogleSignInReversedClientId: (applePlatform: 'ios' | 'macos') => (config: Pick<ExpoConfig, "ios" | "macos">, infoPlist: InfoPlist, modRequest: Pick<ModProps<InfoPlist>, 'projectRoot'>) => InfoPlist;
export declare const setGoogleConfig: (applePlatform: 'ios' | 'macos') => (config: Pick<ExpoConfig, "ios" | "macos">, infoPlist: InfoPlist, modRequest: ModProps<InfoPlist>) => InfoPlist;
export declare const setGoogleServicesFile: (applePlatform: 'ios' | 'macos') => (config: Pick<ExpoConfig, "ios" | "macos">, { projectRoot, project }: {
    project: XcodeProject;
    projectRoot: string;
}) => XcodeProject;
