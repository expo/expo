import { ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';

import { withUserTrackingPermission } from './withFacebookAdsIOS';
import { withSKAdNetworkIdentifiers } from './withSKAdNetworkIdentifiers';

const pkg = require('expo-ads-facebook/package.json');

const withFacebookAds: ConfigPlugin<
  {
    userTrackingPermission?: string;
  } | void
> = (config, props) => {
  config = withUserTrackingPermission(config, props);
  // https://developers.facebook.com/docs/SKAdNetwork
  config = withSKAdNetworkIdentifiers(config, ['v9wttpbfk9.skadnetwork', 'n38lu8286q.skadnetwork']);
  return config;
};

export default createRunOncePlugin(withFacebookAds, pkg.name, pkg.version);
