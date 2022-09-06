import { createLegacyPlugin } from '../createLegacyPlugin';
import { withFacebookAppIdString, withFacebookManifest } from './withAndroidFacebook';
import { withIosFacebook } from './withIosFacebook';
import { withSKAdNetworkIdentifiers } from './withSKAdNetworkIdentifiers';

export default createLegacyPlugin({
  packageName: 'expo-facebook',
  fallback: [
    // Android
    withFacebookAppIdString,
    withFacebookManifest,
    // iOS
    withIosFacebook,
    [
      withSKAdNetworkIdentifiers,
      // https://developers.facebook.com/docs/SKAdNetwork
      ['v9wttpbfk9.skadnetwork', 'n38lu8286q.skadnetwork'],
    ],
  ],
});
