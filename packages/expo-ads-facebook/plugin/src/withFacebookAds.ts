import { ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';

import { withUserTrackingPermission } from './withFacebookAdsIOS';

const pkg = require('expo-ads-facebook/package.json');

const withFacebookAds: ConfigPlugin<{
  userTrackingPermission?: string;
} | void> = (config, props) => {
  config = withUserTrackingPermission(config, props);
  return config;
};

export default createRunOncePlugin(withFacebookAds, pkg.name, pkg.version);
