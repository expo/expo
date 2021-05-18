import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  withEntitlementsPlist,
  withInfoPlist,
} from '@expo/config-plugins';

const pkg = require('expo-contacts/package.json');

const CONTACTS_USAGE = 'Allow $(PRODUCT_NAME) to access your contacts';

const withContacts: ConfigPlugin<{
  /**
   * The `NSContactsUsageDescription` contact permission message.
   *
   * @default 'Allow $(PRODUCT_NAME) to access your contacts'
   */
  contactsPermission?: string;
  /**
   * If true, the `com.apple.developer.contacts.notes` entitlement will be added to your iOS project.
   * This entitlement is _heavily_ restricted and requires prior permission from Apple via [this form](https://developer.apple.com/contact/request/contact-note-field).
   *
   * @default false
   */
  enableIosContactNotes?: boolean;
} | void> = (config, { contactsPermission, enableIosContactNotes } = {}) => {
  // Append iOS contacts permission
  config = withInfoPlist(config, config => {
    // @ts-ignore: untyped
    config.modResults.NSContactsUsageDescription =
      // @ts-ignore: untyped
      contactsPermission || config.modResults.NSContactsUsageDescription || CONTACTS_USAGE;
    return config;
  });

  // Add contact notes entitlement
  config = withEntitlementsPlist(config, config => {
    if (enableIosContactNotes) {
      config.modResults['com.apple.developer.contacts.notes'] = true;
    } else if (enableIosContactNotes === false) {
      delete config.modResults['com.apple.developer.contacts.notes'];
    }
    return config;
  });

  // Add Android contacts permissions
  config = AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.READ_CONTACTS',
    'android.permission.WRITE_CONTACTS',
  ]);

  return config;
};

export default createRunOncePlugin(withContacts, pkg.name, pkg.version);
