import { ConfigPlugin } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
import { IosSplashScreenConfig } from '@expo/configure-splash-screen';
export declare const withSplashScreenIOS: ConfigPlugin;
export declare function getSplashScreen(config: ExpoConfig): IosSplashScreenConfig | undefined;
export declare function setSplashScreenAsync(config: ExpoConfig, projectRoot: string): Promise<void>;
