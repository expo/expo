"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setBranchApiKey = exports.getBranchApiKey = exports.withBranchIOS = void 0;
const ios_plugins_1 = require("@expo/config-plugins/build/plugins/ios-plugins");
exports.withBranchIOS = ios_plugins_1.createInfoPlistPlugin(setBranchApiKey, 'withBranchIOS');
function getBranchApiKey(config) {
    var _a, _b, _c, _d;
    return (_d = (_c = (_b = (_a = config.ios) === null || _a === void 0 ? void 0 : _a.config) === null || _b === void 0 ? void 0 : _b.branch) === null || _c === void 0 ? void 0 : _c.apiKey) !== null && _d !== void 0 ? _d : null;
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
