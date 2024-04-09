import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  withInfoPlist,
} from 'expo/config-plugins';

const pkg = require('expo-contacts/package.json');

const CONTACTS_USAGE = 'Allow $(PRODUCT_NAME) to access your contacts';

const withContacts: ConfigPlugin<{ contactsPermission?: string } | void> = (
  config,
  { contactsPermission } = {}
) => {
  withInfoPlist(config, (config) => {
    config.modResults.NSContactsUsageDescription =
      contactsPermission || config.modResults.NSContactsUsageDescription || CONTACTS_USAGE;
    return config;
  });

  return AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.READ_CONTACTS',
    'android.permission.WRITE_CONTACTS',
  ]);
};

export default createRunOncePlugin(withContacts, pkg.name, pkg.version);
