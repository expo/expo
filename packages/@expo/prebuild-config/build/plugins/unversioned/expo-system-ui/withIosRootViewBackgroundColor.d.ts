import { ConfigPlugin, InfoPlist } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
export declare const withIosRootViewBackgroundColor: ConfigPlugin;
/** The template was changed in SDK 43 to move the background color logic to the `expo-system-ui` module */
export declare function shouldUseLegacyBehavior(config: Pick<ExpoConfig, 'sdkVersion'>): boolean;
export declare function warnSystemUIMissing(config: Pick<ExpoConfig, 'sdkVersion' | 'backgroundColor' | 'ios'>): void;
export declare function setRootViewBackgroundColor(config: Pick<ExpoConfig, 'backgroundColor' | 'ios'>, infoPlist: InfoPlist): InfoPlist;
export declare function getRootViewBackgroundColor(config: Pick<ExpoConfig, 'ios' | 'backgroundColor'>): string | null;
