import { AndroidSplashConfig } from '@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/getAndroidSplashConfig';
import { IOSSplashConfig } from '@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/getIosSplashConfig';
import { ConfigPlugin } from 'expo/config-plugins';
type SplashConfig = {
    ios?: IOSSplashConfig;
    android?: AndroidSplashConfig;
} | undefined | null | void;
declare const _default: ConfigPlugin<SplashConfig>;
export default _default;
