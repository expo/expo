import { ConfigPlugin } from '@expo/config-plugins';
import { SplashScreenConfig } from './getAndroidSplashConfig';
export declare const withAndroidSplashDrawables: ConfigPlugin<Pick<SplashScreenConfig, 'resizeMode'>>;
export declare function setSplashDrawableAsync({ resizeMode }: Pick<SplashScreenConfig, 'resizeMode'>, projectRoot: string): Promise<void>;
