import { ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';

import { withFacebookAppIdString, withFacebookManifest } from './withFacebookAndroid';
import { withFacebookIOS, withUserTrackingPermission } from './withFacebookIOS';
import { withNoopSwiftFile } from './withNoopSwiftFile';
import { withSKAdNetworkIdentifiers } from './withSKAdNetworkIdentifiers';

const pkg = require('expo-facebook/package.json');

const withFacebook: ConfigPlugin<{
  /**
   * Sets the iOS `NSUserTrackingUsageDescription` permission message in the `Info.plist`.
   * Passing `false` will skip adding the permission.
   * @default 'This identifier will be used to deliver personalized ads to you.'
   */
  userTrackingPermission?: string | false;
} | void> = (config, props) => {
  config = withFacebookAppIdString(config);
  config = withFacebookManifest(config);
  config = withFacebookIOS(config);
  config = withUserTrackingPermission(config, props);
  // https://developers.facebook.com/docs/SKAdNetwork
  config = withSKAdNetworkIdentifiers(config, ['v9wttpbfk9.skadnetwork', 'n38lu8286q.skadnetwork']);
  config = withNoopSwiftFile(config);

  return config;
};

export default createRunOncePlugin(withFacebook, pkg.name, pkg.version);
