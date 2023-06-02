import { ConfigPlugin } from '@expo/config-plugins';
import { AndroidSplashConfig } from './getAndroidSplashConfig';
export declare const withAndroidSplashDrawables: ConfigPlugin<Pick<AndroidSplashConfig, 'resizeMode'>>;
export declare function setSplashDrawableAsync({ resizeMode }: Pick<AndroidSplashConfig, 'resizeMode'>, projectRoot: string): Promise<void>;
