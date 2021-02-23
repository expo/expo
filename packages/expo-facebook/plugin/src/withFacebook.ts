import { ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';

import { withFacebookAppIdString, withFacebookManifest } from './withFacebookAndroid';
import { withFacebookIOS } from './withFacebookIOS';

const pkg = require('expo-facebook/package.json');

const withFacebook: ConfigPlugin = config => {
  config = withFacebookAppIdString(config);
  config = withFacebookManifest(config);
  config = withFacebookIOS(config);
  return config;
};

export default createRunOncePlugin(withFacebook, pkg.name, pkg.version);
