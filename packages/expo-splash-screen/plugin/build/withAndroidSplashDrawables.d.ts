import { ConfigPlugin } from 'expo/config-plugins';
import { AndroidSplashConfig } from './types';
export declare const withAndroidSplashDrawables: ConfigPlugin<AndroidSplashConfig>;
export declare function setSplashDrawableAsync({ image }: AndroidSplashConfig, projectRoot: string): Promise<void>;
