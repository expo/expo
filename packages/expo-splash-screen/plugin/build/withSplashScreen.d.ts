import { AndroidSplashConfig } from '@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/getAndroidSplashConfig';
import { IOSSplashConfig } from '@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/getIosSplashConfig';
import { ConfigPlugin } from 'expo/config-plugins';
export type PluginConfig = {
    /**
     * Hex color for the splash screen background.
     * @default "#ffffff"
     */
    backgroundColor?: string;
    /**
     * The width to make the image.
     * @default 100
     */
    imageWidth?: number;
    /**
     * Whether to use a full screen image as the splash screen. Legacy transition helper, will be removed.
     * @default false
     */
    enableFullScreenImage_legacy?: boolean;
    /**
     * Path to the image displayed on the splash screen.
     */
    image?: string;
    /**
     * How the image is scaled. Accepts `contain`, `cover`, `native`.
     * @default "contain"
     */
    resizeMode?: 'contain' | 'cover' | 'native';
    /**
     * Properties for configuring the splash screen in dark mode.
     */
    dark?: {
        image?: string;
        backgroundColor?: string;
    };
    /**
     * Properties for configuring the splash screen on Android.
     * @platform android
     */
    android?: AndroidSplashConfig;
    /**
     * Properties for configuring the splash screen on iOS.
     * @platform ios
     */
    ios?: IOSSplashConfig;
};
declare const _default: ConfigPlugin<PluginConfig | null>;
export default _default;
