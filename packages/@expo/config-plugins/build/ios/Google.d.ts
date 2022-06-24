import { ExpoConfig } from '@expo/config-types';
import { XcodeProject } from 'xcode';
import { ConfigPlugin, ModProps } from '../Plugin.types';
import { InfoPlist } from './IosConfig.types';
export declare const withGoogle: ConfigPlugin;
export declare const withGoogleServicesFile: ConfigPlugin;
export declare function getGoogleSignInReservedClientId(config: Pick<ExpoConfig, 'ios'>, modRequest: Pick<ModProps<InfoPlist>, 'projectRoot'>): string | null;
export declare function getGoogleServicesFile(config: Pick<ExpoConfig, 'ios'>): string | null;
export declare function setGoogleSignInReservedClientId(config: Pick<ExpoConfig, 'ios'>, infoPlist: InfoPlist, modRequest: Pick<ModProps<InfoPlist>, 'projectRoot'>): InfoPlist;
export declare function setGoogleConfig(config: Pick<ExpoConfig, 'ios'>, infoPlist: InfoPlist, modRequest: ModProps<InfoPlist>): InfoPlist;
export declare function setGoogleServicesFile(config: Pick<ExpoConfig, 'ios'>, { projectRoot, project }: {
    project: XcodeProject;
    projectRoot: string;
}): XcodeProject;
