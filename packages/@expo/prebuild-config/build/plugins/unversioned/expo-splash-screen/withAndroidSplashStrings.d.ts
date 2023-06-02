import { AndroidConfig, ConfigPlugin } from '@expo/config-plugins';
type ExtraProps = {
    resizeMode?: string;
    fadeTime?: number;
};
export declare const withAndroidSplashStrings: ConfigPlugin<ExtraProps>;
export declare function setSplashStrings(strings: AndroidConfig.Resources.ResourceXML, resizeMode: string, statusBarTranslucent: boolean, fadeTime: string): AndroidConfig.Resources.ResourceXML;
export {};
