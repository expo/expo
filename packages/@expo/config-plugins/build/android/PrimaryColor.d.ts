import { ExpoConfig } from '@expo/config-types';
import { ConfigPlugin } from '../Plugin.types';
export declare const withPrimaryColor: ConfigPlugin;
export declare const withPrimaryColorColors: ConfigPlugin;
export declare const withPrimaryColorStyles: ConfigPlugin;
export declare function getPrimaryColor(config: Pick<ExpoConfig, 'primaryColor'>): string;
