"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const withBranchAndroid_1 = require("./withBranchAndroid");
const withBranchIOS_1 = require("./withBranchIOS");
const pkg = require('expo-branch/package.json');
const withBranch = config => {
    config = withBranchAndroid_1.withBranchAndroid(config);
    config = withBranchIOS_1.withBranchIOS(config);
    return config;
};
exports.default = config_plugins_1.createRunOncePlugin(withBranch, pkg.name, pkg.version);
