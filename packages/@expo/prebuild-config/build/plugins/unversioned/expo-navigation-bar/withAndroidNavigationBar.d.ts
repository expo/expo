import { AndroidConfig, ConfigPlugin } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
export declare const withNavigationBar: ConfigPlugin;
export declare function setNavigationBarColors(config: Pick<ExpoConfig, 'androidNavigationBar'>, colors: AndroidConfig.Resources.ResourceXML): AndroidConfig.Resources.ResourceXML;
export declare function setNavigationBarStyles(config: Pick<ExpoConfig, 'androidNavigationBar'>, styles: AndroidConfig.Resources.ResourceXML): AndroidConfig.Resources.ResourceXML;
export declare function getNavigationBarImmersiveMode(config: Pick<ExpoConfig, 'androidNavigationBar'>): "leanback" | "immersive" | "sticky-immersive" | null;
export declare function getNavigationBarColor(config: Pick<ExpoConfig, 'androidNavigationBar'>): string | null;
export declare function getNavigationBarStyle(config: Pick<ExpoConfig, 'androidNavigationBar'>): "light-content" | "dark-content";
