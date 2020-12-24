const {
  createRunOncePlugin,
  withPlugins,
  AndroidConfig,
  IOSConfig,
} = require('@expo/config-plugins');

const withContacts = (
  config,
  // Should be able to be used without any parameters for auto configuration via expo-cli.
  { contactsPermission = 'Allow $(PRODUCT_NAME) to access your contacts' } = {}
) => {
  return withPlugins(config, [
    [
      IOSConfig.Permissions.withPermissions,
      {
        NSContactsUsageDescription: contactsPermission || null,
      },
    ],
    [
      AndroidConfig.Permissions.withPermissions,
      ['android.permission.READ_CONTACTS', 'android.permission.WRITE_CONTACTS'],
    ],
  ]);
};

const pkg = require('./package.json');

module.exports = createRunOncePlugin(withContacts, pkg.name, pkg.version);
