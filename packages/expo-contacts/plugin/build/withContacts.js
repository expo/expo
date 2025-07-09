"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-contacts/package.json');
const CONTACTS_USAGE = 'Allow $(PRODUCT_NAME) to access your contacts';
const withContacts = (config, { contactsPermission } = {}) => {
    config_plugins_1.IOSConfig.Permissions.createPermissionsPlugin({
        NSContactsUsageDescription: CONTACTS_USAGE,
    })(config, {
        NSContactsUsageDescription: contactsPermission,
    });
    return config_plugins_1.AndroidConfig.Permissions.withPermissions(config, [
        'android.permission.READ_CONTACTS',
        'android.permission.WRITE_CONTACTS',
    ]);
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withContacts, pkg.name, pkg.version);
