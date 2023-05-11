import { ExpoConfig } from '@expo/config-types';
type ExpoConfigIosSplash = NonNullable<NonNullable<ExpoConfig['ios']>['splash']>;
export interface IOSSplashConfig {
    image?: string | null;
    backgroundColor: string;
    fadeTime: number;
    resizeMode: NonNullable<ExpoConfigIosSplash['resizeMode']>;
    tabletImage: string | null;
    tabletBackgroundColor: string | null;
    dark?: {
        image?: string | null;
        backgroundColor?: string | null;
        tabletImage?: string | null;
        tabletBackgroundColor?: string | null;
    };
}
export declare function getIosSplashConfig(config: ExpoConfig): IOSSplashConfig | null;
export {};
