import { AndroidSplashConfig } from '@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/getAndroidSplashConfig';
import { IOSSplashConfig } from '@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/getIosSplashConfig';
import { ConfigPlugin } from 'expo/config-plugins';
export type WithSplashScreenProps = {
    backgroundColor: string;
    imageWidth?: number;
    enableFullScreenImage_legacy?: boolean;
    image?: string;
    dark?: {
        image?: string;
        backgroundColor?: string;
    };
    android?: AndroidSplashConfig;
    ios?: IOSSplashConfig;
};
declare const _default: ConfigPlugin<void | WithSplashScreenProps>;
export default _default;
