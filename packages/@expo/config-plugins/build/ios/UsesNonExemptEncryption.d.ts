import { ExpoConfig } from '@expo/config-types';
import { InfoPlist } from './IosConfig.types';
export declare const withUsesNonExemptEncryption: import("..").ConfigPlugin;
export declare function getUsesNonExemptEncryption(config: Pick<ExpoConfig, 'ios'>): boolean | null;
export declare function setUsesNonExemptEncryption(config: Pick<ExpoConfig, 'ios'>, { ITSAppUsesNonExemptEncryption, ...infoPlist }: InfoPlist): InfoPlist;
