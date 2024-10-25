import { ConfigPlugin } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
import { AndroidSplashConfig } from './getAndroidSplashConfig';
export declare const withAndroidSplashLegacyMainActivity: ConfigPlugin<AndroidSplashConfig>;
export declare function setSplashScreenLegacyMainActivity(config: Pick<ExpoConfig, 'android' | 'androidStatusBar' | 'userInterfaceStyle'>, props: AndroidSplashConfig, mainActivity: string, language: 'java' | 'kt'): string;
