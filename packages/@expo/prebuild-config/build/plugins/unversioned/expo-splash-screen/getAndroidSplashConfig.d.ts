import { ExpoConfig } from '@expo/config-types';
export declare type SplashScreenConfig = {
    xxxhdpi: string | null;
    xxhdpi: string | null;
    xhdpi: string | null;
    hdpi: string | null;
    mdpi: string | null;
    backgroundColor: string | null;
    resizeMode: 'contain' | 'cover' | 'native';
};
export declare function getAndroidSplashConfig(config: Pick<ExpoConfig, 'splash' | 'android'>): SplashScreenConfig | null;
export declare function getAndroidDarkSplashConfig(config: Pick<ExpoConfig, 'splash' | 'android'>): SplashScreenConfig | null;
