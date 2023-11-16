"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const createLegacyPlugin_1 = require("./createLegacyPlugin");
const withAccessesContactNotes = (config) => {
    return (0, config_plugins_1.withEntitlementsPlist)(config, (config) => {
        config.modResults = setAccessesContactNotes(config, config.modResults);
        return config;
    });
};
function setAccessesContactNotes(config, entitlementsPlist) {
    if (config.ios?.accessesContactNotes) {
        return {
            ...entitlementsPlist,
            'com.apple.developer.contacts.notes': true,
        };
    }
    return entitlementsPlist;
}
exports.default = (0, createLegacyPlugin_1.createLegacyPlugin)({
    packageName: 'expo-contacts',
    fallback: withAccessesContactNotes,
});
