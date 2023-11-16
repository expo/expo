"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUsesNonExemptEncryption = exports.getUsesNonExemptEncryption = exports.withUsesNonExemptEncryption = void 0;
const ios_plugins_1 = require("../plugins/ios-plugins");
exports.withUsesNonExemptEncryption = (0, ios_plugins_1.createInfoPlistPluginWithPropertyGuard)(setUsesNonExemptEncryption, {
    infoPlistProperty: 'ITSAppUsesNonExemptEncryption',
    expoConfigProperty: 'ios.config.usesNonExemptEncryption',
}, 'withUsesNonExemptEncryption');
function getUsesNonExemptEncryption(config) {
    return config?.ios?.config?.usesNonExemptEncryption ?? null;
}
exports.getUsesNonExemptEncryption = getUsesNonExemptEncryption;
function setUsesNonExemptEncryption(config, { ITSAppUsesNonExemptEncryption, ...infoPlist }) {
    const usesNonExemptEncryption = getUsesNonExemptEncryption(config);
    // Make no changes if the key is left blank
    if (usesNonExemptEncryption === null) {
        return infoPlist;
    }
    return {
        ...infoPlist,
        ITSAppUsesNonExemptEncryption: usesNonExemptEncryption,
    };
}
exports.setUsesNonExemptEncryption = setUsesNonExemptEncryption;
