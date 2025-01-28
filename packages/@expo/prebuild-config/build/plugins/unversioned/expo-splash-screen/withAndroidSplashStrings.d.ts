import { AndroidConfig, ConfigPlugin } from '@expo/config-plugins';
import { AndroidSplashConfig } from './getAndroidSplashConfig';
export declare const withAndroidSplashStrings: ConfigPlugin<AndroidSplashConfig>;
export declare function setSplashStrings(strings: AndroidConfig.Resources.ResourceXML, resizeMode: string, statusBarTranslucent: boolean): AndroidConfig.Resources.ResourceXML;
