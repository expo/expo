import { ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';

import { withBranchAndroid } from './withBranchAndroid';
import { withBranchIOS } from './withBranchIOS';

const pkg = require('expo-branch/package.json');

/**
 * [Branch](https://branch.io/) key to hook up Branch linking services.
 */
export type Props = {
  /**
   * iOS Branch API key to be embedded in the `Info.plist`.
   * @default Expo config `ios.config.branch.apiKey`
   */
  iosApiKey?: string;
  /**
   * Android Branch API key to be embedded in the `AndroidManifest.xml`.
   * @default Expo config `android.config.branch.apiKey`
   */
  androidApiKey?: string;
};

const withBranch: ConfigPlugin<Props | void> = (config, _props) => {
  const props = _props || {};
  config = withBranchAndroid(config, { apiKey: props.androidApiKey });
  config = withBranchIOS(config, { apiKey: props.iosApiKey });
  return config;
};

export default createRunOncePlugin(withBranch, pkg.name, pkg.version);
