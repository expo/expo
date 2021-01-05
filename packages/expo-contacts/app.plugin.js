const { createRunOncePlugin, withPlugins, AndroidConfig } = require('@expo/config-plugins');

const withContacts = (
  config,
  // Should be able to be used without any parameters for auto configuration via expo-cli.
  { contactsPermission } = {}
) => {
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  config.ios.infoPlist.NSContactsUsageDescription =
    contactsPermission ||
    config.ios.infoPlist.NSContactsUsageDescription ||
    'Allow $(PRODUCT_NAME) to access your contacts';

  return withPlugins(config, [
    [
      AndroidConfig.Permissions.withPermissions,
      ['android.permission.READ_CONTACTS', 'android.permission.WRITE_CONTACTS'],
    ],
  ]);
};

const pkg = require('./package.json');

module.exports = createRunOncePlugin(withContacts, pkg.name, pkg.version);
