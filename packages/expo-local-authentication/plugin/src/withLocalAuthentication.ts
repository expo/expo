import { AndroidConfig, ConfigPlugin, IOSConfig, createRunOncePlugin } from 'expo/config-plugins';

const pkg = require('../../package.json');
const FACE_ID_USAGE = 'Allow $(PRODUCT_NAME) to use Face ID';

export type Props = {
  /**
   * A string to set the `NSFaceIDUsageDescription` permission message.
   * @default "Allow $(PRODUCT_NAME) to use Face ID"
   * @platform ios
   */
  faceIDPermission?: string | false;
};

const withLocalAuthentication: ConfigPlugin<Props | void> = (config, { faceIDPermission } = {}) => {
  IOSConfig.Permissions.createPermissionsPlugin({
    NSFaceIDUsageDescription: FACE_ID_USAGE,
  })(config, {
    NSFaceIDUsageDescription: faceIDPermission,
  });

  return AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.USE_BIOMETRIC',
    'android.permission.USE_FINGERPRINT',
  ]);
};

export default createRunOncePlugin(withLocalAuthentication, pkg.name, pkg.version);
