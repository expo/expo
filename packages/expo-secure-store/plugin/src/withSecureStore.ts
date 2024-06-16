import { ConfigPlugin, IOSConfig, createRunOncePlugin } from '@expo/config-plugins';

const pkg = require('expo-secure-store/package.json');

const FACEID_USAGE = 'Allow $(PRODUCT_NAME) to access your Face ID biometric data.';

const withSecureStore: ConfigPlugin<
  {
    faceIDPermission?: string | false;
  } | void
> = (config, { faceIDPermission } = {}) => {
  return IOSConfig.Permissions.createPermissionsPlugin({
    NSFaceIDUsageDescription: FACEID_USAGE,
  })(config, {
    NSFaceIDUsageDescription: faceIDPermission,
  });
};

export default createRunOncePlugin(withSecureStore, pkg.name, pkg.version);
