"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setBranchApiKey = exports.getBranchApiKey = exports.withBranchIOS = void 0;
const config_plugins_1 = require("expo/config-plugins");
const withBranchIOS = (config) => {
    return (0, config_plugins_1.withInfoPlist)(config, (config) => {
        config.modResults = setBranchApiKey(config, config.modResults);
        return config;
    });
};
exports.withBranchIOS = withBranchIOS;
function getBranchApiKey(config) {
    return config.ios?.config?.branch?.apiKey ?? null;
}
exports.getBranchApiKey = getBranchApiKey;
function setBranchApiKey(config, infoPlist) {
    const apiKey = getBranchApiKey(config);
    if (apiKey === null) {
        return infoPlist;
    }
    return {
        ...infoPlist,
        branch_key: {
            live: apiKey,
        },
    };
}
exports.setBranchApiKey = setBranchApiKey;
