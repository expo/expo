import { InfoPlist } from '@expo/config-plugins/build/ios/IosConfig.types';
import { ExpoConfig } from '@expo/config-types';
export declare const withBranchIOS: import("@expo/config-plugins").ConfigPlugin<void>;
export declare function getBranchApiKey(config: Pick<ExpoConfig, 'ios'>): string | null;
export declare function setBranchApiKey(config: Pick<ExpoConfig, 'ios'>, infoPlist: InfoPlist): InfoPlist;
