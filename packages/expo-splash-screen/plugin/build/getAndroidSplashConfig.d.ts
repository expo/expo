export type SplashScreenConfig = {
    xxxhdpi?: string;
    xxhdpi?: string;
    xhdpi?: string;
    hdpi?: string;
    mdpi?: string;
    image?: string;
    backgroundColor?: string;
    resizeMode: 'contain' | 'cover' | 'native';
    drawable?: {
        icon: string;
        darkIcon?: string;
    };
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
export declare function getAndroidSplashConfig(props: AndroidSplashConfig): AndroidSplashConfig;
export declare function getAndroidDarkSplashConfig(props: AndroidSplashConfig): SplashScreenConfig | null;
