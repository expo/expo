export interface IOSSplashConfig {
    imageWidth?: number;
    image?: string;
    backgroundColor?: string;
    enableFullScreenImage_legacy?: boolean;
    resizeMode?: 'cover' | 'contain';
    tabletImage?: string;
    tabletBackgroundColor?: string;
    dark?: {
        image?: string;
        backgroundColor?: string;
        tabletImage?: string;
        tabletBackgroundColor?: string;
    };
}
export declare function getIosSplashConfig(props: IOSSplashConfig): IOSSplashConfig;
