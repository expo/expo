import { AndroidConfig, ConfigPlugin, IOSConfig, createRunOncePlugin } from 'expo/config-plugins';

const pkg = require('expo-contacts/package.json');

const CONTACTS_USAGE = 'Allow $(PRODUCT_NAME) to access your contacts';

export type WithContactProps = {
  contactsPermission?: string | false;
};

const withContacts: ConfigPlugin<WithContactProps | void> = (
  config,
  { contactsPermission } = {}
) => {
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
