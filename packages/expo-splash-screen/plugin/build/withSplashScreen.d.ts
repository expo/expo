import { ConfigPlugin } from 'expo/config-plugins';
import { AndroidSplashConfig, IOSSplashConfig, Props } from './types';
export declare const withAndroidSplashScreen: ConfigPlugin<AndroidSplashConfig>;
export declare const withIosSplashScreen: ConfigPlugin<IOSSplashConfig>;
declare const _default: ConfigPlugin<Props | null>;
export default _default;
