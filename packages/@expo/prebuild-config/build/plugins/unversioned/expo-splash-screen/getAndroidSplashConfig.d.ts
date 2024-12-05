import { ExpoConfig } from '@expo/config-types';
export type SplashScreenConfig = {
    xxxhdpi?: string;
    xxhdpi?: string;
    xhdpi?: string;
    hdpi?: string;
    mdpi?: string;
    image?: string;
    backgroundColor?: string;
    enableFullScreenImage_legacy?: boolean;
    resizeMode: 'contain' | 'cover' | 'native';
    dark?: {
        backgroundColor?: string;
        xxxhdpi?: string;
        xxhdpi?: string;
        xhdpi?: string;
        hdpi?: string;
        mdpi?: string;
        image?: string;
        resizeMode?: 'contain' | 'cover' | 'native';
    };
};
export type AndroidSplashConfig = {
    imageWidth?: number;
} & SplashScreenConfig;
export declare function getAndroidSplashConfig(config: Pick<ExpoConfig, 'splash' | 'android'>, props?: AndroidSplashConfig | null): AndroidSplashConfig | null;
export declare function getAndroidDarkSplashConfig(config: Pick<ExpoConfig, 'splash' | 'android'>, props?: AndroidSplashConfig | null): SplashScreenConfig | null;
