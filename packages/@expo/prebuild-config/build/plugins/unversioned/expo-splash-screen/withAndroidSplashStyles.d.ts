import { AndroidConfig, ConfigPlugin } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
export declare const withAndroidSplashStyles: ConfigPlugin;
export declare function removeOldSplashStyleGroup(styles: AndroidConfig.Resources.ResourceXML): AndroidConfig.Resources.ResourceXML;
export declare function getSplashBackgroundColor(config: ExpoConfig): string | null;
export declare function getSplashDarkBackgroundColor(config: ExpoConfig): string | null;
export declare function setSplashStylesForTheme(styles: AndroidConfig.Resources.ResourceXML): AndroidConfig.Resources.ResourceXML;
export declare function setSplashColorsForTheme(colors: AndroidConfig.Resources.ResourceXML, backgroundColor: string | null): AndroidConfig.Resources.ResourceXML;
