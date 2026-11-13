import { AndroidConfig, ConfigPlugin, IOSConfig, createRunOncePlugin } from 'expo/config-plugins';

const pkg = require('../../package.json');

const CONTACTS_USAGE = 'Allow $(PRODUCT_NAME) to access your contacts';

export type Props = {
  /**
   * A string to set the `NSContactsUsageDescription` permission message.
   * @default "Allow $(PRODUCT_NAME) to access your contacts"
   * @platform ios
   */
  contactsPermission?: string;
  /**
   * Whether to enable the `READ_CONTACTS` permission on Android.
   * @default true
   * @platform android
   */
  readContactsAndroid?: boolean;
  /**
   * Whether to enable the `WRITE_CONTACTS` permission on Android.
   * @default true
   * @platform android
   */
  writeContactsAndroid?: boolean;
};

const withContacts: ConfigPlugin<Props | void> = (
  config,
  { contactsPermission, readContactsAndroid = true, writeContactsAndroid = true } = {}
) => {
  IOSConfig.Permissions.createPermissionsPlugin({
    NSContactsUsageDescription: CONTACTS_USAGE,
  })(config, {
    NSContactsUsageDescription: contactsPermission,
  });

  const androidPermissions: string[] = [];
  if (readContactsAndroid) {
    androidPermissions.push('android.permission.READ_CONTACTS');
  }
  if (writeContactsAndroid) {
    androidPermissions.push('android.permission.WRITE_CONTACTS');
  }

  return AndroidConfig.Permissions.withPermissions(config, androidPermissions);
};

export default createRunOncePlugin(withContacts, pkg.name, pkg.version);
