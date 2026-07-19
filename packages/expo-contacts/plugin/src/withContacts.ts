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
};

const withContacts: ConfigPlugin<Props | void> = (config, { contactsPermission } = {}) => {
  IOSConfig.Permissions.createPermissionsPlugin({
    NSContactsUsageDescription: CONTACTS_USAGE,
  })(config, {
    NSContactsUsageDescription: contactsPermission,
  });

  return AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.READ_CONTACTS',
    'android.permission.WRITE_CONTACTS',
  ]);
};

export default createRunOncePlugin(withContacts, pkg.name, pkg.version);
