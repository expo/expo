import { ConfigPlugin, InfoPlist } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
export declare const withIosBranch: ConfigPlugin;
export declare function getBranchApiKey(config: Pick<ExpoConfig, 'ios'>): string | null;
export declare function setBranchApiKey(config: Pick<ExpoConfig, 'ios'>, infoPlist: InfoPlist): InfoPlist;
