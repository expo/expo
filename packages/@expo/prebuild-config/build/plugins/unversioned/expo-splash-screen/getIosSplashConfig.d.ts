import { ExpoConfig } from '@expo/config-types';
type ExpoConfigIosSplash = NonNullable<NonNullable<ExpoConfig['ios']>['splash']>;
export interface IOSSplashConfig {
    imageWidth?: number;
    image?: string;
    backgroundColor: string;
    enableFullScreenImage_legacy?: boolean;
    resizeMode: NonNullable<ExpoConfigIosSplash['resizeMode']>;
    tabletImage?: string;
    tabletBackgroundColor?: string;
    dark?: {
        image?: string;
        backgroundColor?: string;
        tabletImage?: string;
        tabletBackgroundColor?: string;
    };
}
export declare function getIosSplashConfig(config: ExpoConfig, props: IOSSplashConfig | null): IOSSplashConfig | null;
export {};
