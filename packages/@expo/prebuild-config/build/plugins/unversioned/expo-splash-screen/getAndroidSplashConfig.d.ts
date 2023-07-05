import { ExpoConfig } from '@expo/config-types';
export interface AndroidSplashConfig {
    xxxhdpi: string | null;
    xxhdpi: string | null;
    xhdpi: string | null;
    hdpi: string | null;
    mdpi: string | null;
    backgroundColor: string | null;
    resizeMode: 'contain' | 'cover' | 'native';
    fadeDurationMs: number;
}
export declare function getAndroidSplashConfig(config: Pick<ExpoConfig, 'splash' | 'android'>): AndroidSplashConfig;
export declare function getAndroidDarkSplashConfig(config: Pick<ExpoConfig, 'splash' | 'android'>): AndroidSplashConfig | null;
