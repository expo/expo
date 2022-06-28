import { ConfigPlugin } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
export declare const withAndroidSplashLegacyMainActivity: ConfigPlugin;
export declare function setSplashScreenLegacyMainActivity(config: Pick<ExpoConfig, 'android' | 'androidStatusBar' | 'userInterfaceStyle'>, mainActivity: string, language: 'java' | 'kt'): string;
