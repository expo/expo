import { ExpoConfig } from 'expo/config';
import { ConfigPlugin, InfoPlist } from 'expo/config-plugins';
export declare const withBranchIOS: ConfigPlugin;
export declare function getBranchApiKey(config: Pick<ExpoConfig, 'ios'>): string | null;
export declare function setBranchApiKey(config: Pick<ExpoConfig, 'ios'>, infoPlist: InfoPlist): InfoPlist;
