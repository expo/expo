import { AndroidSplashConfig } from '@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/getAndroidSplashConfig';
import { IOSSplashConfig } from '@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/getIosSplashConfig';
import { withAndroidSplashScreen } from '@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/withAndroidSplashScreen';
import { withIosSplashScreen } from '@expo/prebuild-config/build/plugins/unversioned/expo-splash-screen/withIosSplashScreen';
import Debug from 'debug';
import { ConfigPlugin, createRunOncePlugin } from 'expo/config-plugins';

const debug = Debug('expo:prebuild-config:expo-splash-screen');
const pkg = require('expo-splash-screen/package.json');

type SplashConfig =
  | {
      ios?: IOSSplashConfig;
      android?: AndroidSplashConfig;
    }
  | undefined
  | null
  | void;

const withSplashScreen: ConfigPlugin<SplashConfig> = (config, splash = undefined) => {
  // For simplicity, we'll version the unversioned code in expo-splash-screen.
  // This adds more JS to the package overall, but the trade-off is less copying between expo-cli/expo.
  debug(`Custom splash info provided: ${JSON.stringify(splash, null, 2)}`);
  config = withAndroidSplashScreen(config, splash?.android || undefined);
  config = withIosSplashScreen(config, splash?.ios || undefined);
  return config;
};

export default createRunOncePlugin(withSplashScreen, pkg.name, pkg.version);
