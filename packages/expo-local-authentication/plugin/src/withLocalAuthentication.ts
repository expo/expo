import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  withInfoPlist,
} from 'expo/config-plugins';

const pkg = require('expo-local-authentication/package.json');
const FACE_ID_USAGE = 'Allow $(PRODUCT_NAME) to use Face ID';

const withLocalAuthentication: ConfigPlugin<{ faceIDPermission?: string } | void> = (
  config,
  { faceIDPermission } = {}
) => {
  withInfoPlist(config, (config) => {
    config.modResults.NSFaceIDUsageDescription =
      faceIDPermission || config.modResults.NSFaceIDUsageDescription || FACE_ID_USAGE;
    return config;
  });

  return AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.USE_BIOMETRIC',
    'android.permission.USE_FINGERPRINT',
  ]);
};

export default createRunOncePlugin(withLocalAuthentication, pkg.name, pkg.version);
