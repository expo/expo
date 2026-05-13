"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
// We only want to notify the user once
let DID_NOTIFY = false;
const withDevLauncherWarning = (config) => {
    if (!DID_NOTIFY && (0, utils_1.checkPlugin)(config, 'expo-dev-client')) {
        DID_NOTIFY = true;
        console.warn("⚠ It seems that you're using `expo-dev-client` with `expo-brownfield`");
        console.warn("`expo-dev-client` isn't currently supported in the isolated brownfield setup");
        console.warn('Please use `expo-dev-menu` instead');
    }
};
exports.default = withDevLauncherWarning;
