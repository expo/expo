import { ExpoConfig } from '@expo/config-types';
import { XcodeProject } from 'xcode';
import { InfoPlist } from './IosConfig.types';
import { ConfigPlugin, ModProps } from '../Plugin.types';
export declare const withGoogle: ConfigPlugin;
export declare const withGoogleServicesFile: ConfigPlugin;
export declare function getGoogleSignInReversedClientId(config: Pick<ExpoConfig, 'ios'>, modRequest: Pick<ModProps<InfoPlist>, 'projectRoot'>): string | null;
export declare function getGoogleServicesFile(config: Pick<ExpoConfig, 'ios'>): string | null;
export declare function setGoogleSignInReversedClientId(config: Pick<ExpoConfig, 'ios'>, infoPlist: InfoPlist, modRequest: Pick<ModProps<InfoPlist>, 'projectRoot'>): InfoPlist;
export declare function setGoogleConfig(config: Pick<ExpoConfig, 'ios'>, infoPlist: InfoPlist, modRequest: ModProps<InfoPlist>): InfoPlist;
export declare function setGoogleServicesFile(config: Pick<ExpoConfig, 'ios'>, { projectRoot, project }: {
    project: XcodeProject;
    projectRoot: string;
}): XcodeProject;
