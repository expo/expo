import { ConfigPlugin, createRunOncePlugin, withInfoPlist } from '@expo/config-plugins';

const pkg = require('expo-secure-store/package.json');

const FACEID_USAGE = 'Allow $(PRODUCT_NAME) to access your Face ID biometric data.';

const withSecureStore: ConfigPlugin<
  {
    faceIDPermission?: string;
  } | void
> = (config, { faceIDPermission } = {}) => {
  return withInfoPlist(config, (config) => {
    config.modResults.NSFaceIDUsageDescription =
      faceIDPermission || config.modResults.NSFaceIDUsageDescription || FACEID_USAGE;

    return config;
  });
};

export default createRunOncePlugin(withSecureStore, pkg.name, pkg.version);
