"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const pkg = require('expo-firebase-core/package.json');
const withFirebaseAppDelegate = (config) => {
    // The main purpose of this config plugin would be to include the `GoogleService-Info.plist` but currently
    // the unversioned plugin already does that.
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withFirebaseAppDelegate, pkg.name, pkg.version);
