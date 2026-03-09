import { AndroidConfig, ConfigPlugin } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
export declare const withNavigationBar: ConfigPlugin;
export declare function setNavigationBarStyles(config: Pick<ExpoConfig, 'androidNavigationBar'>, styles: AndroidConfig.Resources.ResourceXML): AndroidConfig.Resources.ResourceXML;
export declare function getNavigationBarStyle(config: Pick<ExpoConfig, 'androidNavigationBar'>): "light-content" | "dark-content";
