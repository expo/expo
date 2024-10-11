import { ExpoConfig } from '@expo/config-types';
export type SplashScreenConfig = {
    xxxhdpi?: string | null;
    xxhdpi?: string | null;
    xhdpi?: string | null;
    hdpi?: string | null;
    mdpi?: string | null;
    image?: string | null;
    backgroundColor: string | null;
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
    logoWidth?: number;
} & SplashScreenConfig;
export declare function getAndroidSplashConfig(config: Pick<ExpoConfig, 'splash' | 'android'>, props?: AndroidSplashConfig | null): SplashScreenConfig | null;
export declare function getAndroidDarkSplashConfig(config: Pick<ExpoConfig, 'splash' | 'android'>, props: AndroidSplashConfig | null): SplashScreenConfig | null;
