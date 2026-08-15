import type { ExpoConfig } from 'expo/config';

import { checkPlugin } from '../utils';

// We only want to notify the user once
let DID_NOTIFY = false;

const withDevLauncherWarning = (config: ExpoConfig) => {
  if (!DID_NOTIFY && checkPlugin(config, 'expo-dev-client')) {
    DID_NOTIFY = true;

    console.warn("⚠ It seems that you're using `expo-dev-client` with `expo-brownfield`");
    console.warn("`expo-dev-client` isn't currently supported in the isolated brownfield setup");
    console.warn('Please use `expo-dev-menu` instead');
  }
};

export default withDevLauncherWarning;
