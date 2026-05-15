import { AndroidConfig, ConfigPlugin } from 'expo/config-plugins';
import { AndroidSplashConfig } from './types';
export declare const withAndroidSplashStyles: ConfigPlugin<AndroidSplashConfig>;
export declare function removeOldSplashStyleGroup(styles: AndroidConfig.Resources.ResourceXML): AndroidConfig.Resources.ResourceXML;
export declare function setSplashStylesForTheme(styles: AndroidConfig.Resources.ResourceXML): AndroidConfig.Resources.ResourceXML;
export declare function setSplashColorsForTheme(colors: AndroidConfig.Resources.ResourceXML, backgroundColor: string | undefined): AndroidConfig.Resources.ResourceXML;
