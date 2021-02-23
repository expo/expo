import { ConfigPlugin } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
import { AndroidSplashScreenConfig } from '@expo/configure-splash-screen';
export declare const withSplashScreenAndroid: ConfigPlugin;
export declare function getSplashScreenConfig(config: ExpoConfig): AndroidSplashScreenConfig | undefined;
export declare function setSplashScreenAsync(config: ExpoConfig, projectRoot: string): Promise<void>;
