import { AndroidConfig, ConfigPlugin } from 'expo/config-plugins';
import { AndroidSplashConfig } from './types';
export declare const withAndroidSplashStrings: ConfigPlugin<AndroidSplashConfig>;
export declare function setSplashStrings(strings: AndroidConfig.Resources.ResourceXML, resizeMode: string): AndroidConfig.Resources.ResourceXML;
