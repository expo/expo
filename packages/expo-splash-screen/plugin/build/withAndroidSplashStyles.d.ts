import { AndroidConfig, ConfigPlugin } from 'expo/config-plugins';
import { AndroidSplashConfig } from './getAndroidSplashConfig';
export declare const withAndroidSplashStyles: ConfigPlugin<AndroidSplashConfig>;
export declare function removeOldSplashStyleGroup(styles: AndroidConfig.Resources.ResourceXML): AndroidConfig.Resources.ResourceXML;
export declare function getSplashBackgroundColor(props: AndroidSplashConfig): string | null;
export declare function getSplashDarkBackgroundColor(props: AndroidSplashConfig): string | null;
export declare function setSplashStylesForTheme(styles: AndroidConfig.Resources.ResourceXML): AndroidConfig.Resources.ResourceXML;
export declare function setSplashColorsForTheme(colors: AndroidConfig.Resources.ResourceXML, backgroundColor: string | null): AndroidConfig.Resources.ResourceXML;
