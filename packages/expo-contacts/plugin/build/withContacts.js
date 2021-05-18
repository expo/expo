"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const pkg = require('expo-contacts/package.json');
const CONTACTS_USAGE = 'Allow $(PRODUCT_NAME) to access your contacts';
const withContacts = (config, { contactsPermission, enableIosContactNotes } = {}) => {
    // Append iOS contacts permission
    config = config_plugins_1.withInfoPlist(config, config => {
        // @ts-ignore: untyped
        config.modResults.NSContactsUsageDescription =
            // @ts-ignore: untyped
            contactsPermission || config.modResults.NSContactsUsageDescription || CONTACTS_USAGE;
        return config;
    });
    // Add contact notes entitlement
    config = config_plugins_1.withEntitlementsPlist(config, config => {
        if (enableIosContactNotes) {
            config.modResults['com.apple.developer.contacts.notes'] = true;
        }
        else if (enableIosContactNotes === false) {
            delete config.modResults['com.apple.developer.contacts.notes'];
        }
        return config;
    });
    // Add Android contacts permissions
    config = config_plugins_1.AndroidConfig.Permissions.withPermissions(config, [
        'android.permission.READ_CONTACTS',
        'android.permission.WRITE_CONTACTS',
    ]);
    return config;
};
exports.default = config_plugins_1.createRunOncePlugin(withContacts, pkg.name, pkg.version);
