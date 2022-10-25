import { ExpoConfig } from 'expo/config';
import { ConfigPlugin } from 'expo/config-plugins';
export declare const withAndroidRootViewBackgroundColor: ConfigPlugin;
export declare const withRootViewBackgroundColorColors: ConfigPlugin;
export declare const withRootViewBackgroundColorStyles: ConfigPlugin;
export declare function getRootViewBackgroundColor(config: Pick<ExpoConfig, 'android' | 'backgroundColor'>): string | null;
