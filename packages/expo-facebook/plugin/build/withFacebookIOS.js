"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withUserTrackingPermission = exports.setFacebookApplicationQuerySchemes = exports.setFacebookDisplayName = exports.setFacebookAppId = exports.setFacebookAdvertiserIDCollectionEnabled = exports.setFacebookAutoLogAppEventsEnabled = exports.setFacebookAutoInitEnabled = exports.setFacebookScheme = exports.setFacebookConfig = exports.getFacebookAdvertiserIDCollection = exports.getFacebookAutoLogAppEvents = exports.getFacebookAutoInitEnabled = exports.getFacebookDisplayName = exports.getFacebookAppId = exports.getFacebookScheme = exports.withFacebookIOS = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const { Scheme } = config_plugins_1.IOSConfig;
const { appendScheme } = Scheme;
const fbSchemes = ['fbapi', 'fb-messenger-api', 'fbauth2', 'fbshareextension'];
const USER_TRACKING = 'This identifier will be used to deliver personalized ads to you.';
exports.withFacebookIOS = config => {
    return config_plugins_1.withInfoPlist(config, config => {
        config.modResults = setFacebookConfig(config, config.modResults);
        return config;
    });
};
/**
 * Getters
 * TODO: these getters are the same between ios/android, we could reuse them
 */
function getFacebookScheme(config) {
    var _a;
    return (_a = config.facebookScheme) !== null && _a !== void 0 ? _a : null;
}
exports.getFacebookScheme = getFacebookScheme;
function getFacebookAppId(config) {
    var _a;
    return (_a = config.facebookAppId) !== null && _a !== void 0 ? _a : null;
}
exports.getFacebookAppId = getFacebookAppId;
function getFacebookDisplayName(config) {
    var _a;
    return (_a = config.facebookDisplayName) !== null && _a !== void 0 ? _a : null;
}
exports.getFacebookDisplayName = getFacebookDisplayName;
function getFacebookAutoInitEnabled(config) {
    var _a;
    return (_a = config.facebookAutoInitEnabled) !== null && _a !== void 0 ? _a : null;
}
exports.getFacebookAutoInitEnabled = getFacebookAutoInitEnabled;
function getFacebookAutoLogAppEvents(config) {
    var _a;
    return (_a = config.facebookAutoLogAppEventsEnabled) !== null && _a !== void 0 ? _a : null;
}
exports.getFacebookAutoLogAppEvents = getFacebookAutoLogAppEvents;
function getFacebookAdvertiserIDCollection(config) {
    var _a;
    return (_a = config.facebookAdvertiserIDCollectionEnabled) !== null && _a !== void 0 ? _a : null;
}
exports.getFacebookAdvertiserIDCollection = getFacebookAdvertiserIDCollection;
/**
 * Setters
 */
function setFacebookConfig(config, infoPlist) {
    infoPlist = setFacebookAppId(config, infoPlist);
    infoPlist = setFacebookApplicationQuerySchemes(config, infoPlist);
    infoPlist = setFacebookDisplayName(config, infoPlist);
    infoPlist = setFacebookAutoInitEnabled(config, infoPlist);
    infoPlist = setFacebookAutoLogAppEventsEnabled(config, infoPlist);
    infoPlist = setFacebookAdvertiserIDCollectionEnabled(config, infoPlist);
    infoPlist = setFacebookScheme(config, infoPlist);
    return infoPlist;
}
exports.setFacebookConfig = setFacebookConfig;
function setFacebookScheme(config, infoPlist) {
    const facebookScheme = getFacebookScheme(config);
    return appendScheme(facebookScheme, infoPlist);
}
exports.setFacebookScheme = setFacebookScheme;
function setFacebookAutoInitEnabled(config, { FacebookAutoInitEnabled, ...infoPlist }) {
    const facebookAutoInitEnabled = getFacebookAutoInitEnabled(config);
    if (facebookAutoInitEnabled === null) {
        return infoPlist;
    }
    return {
        ...infoPlist,
        FacebookAutoInitEnabled: facebookAutoInitEnabled,
    };
}
exports.setFacebookAutoInitEnabled = setFacebookAutoInitEnabled;
function setFacebookAutoLogAppEventsEnabled(config, { FacebookAutoLogAppEventsEnabled, ...infoPlist }) {
    const facebookAutoLogAppEventsEnabled = getFacebookAutoLogAppEvents(config);
    if (facebookAutoLogAppEventsEnabled === null) {
        return infoPlist;
    }
    return {
        ...infoPlist,
        FacebookAutoLogAppEventsEnabled: facebookAutoLogAppEventsEnabled,
    };
}
exports.setFacebookAutoLogAppEventsEnabled = setFacebookAutoLogAppEventsEnabled;
function setFacebookAdvertiserIDCollectionEnabled(config, { FacebookAdvertiserIDCollectionEnabled, ...infoPlist }) {
    const facebookAdvertiserIDCollectionEnabled = getFacebookAdvertiserIDCollection(config);
    if (facebookAdvertiserIDCollectionEnabled === null) {
        return infoPlist;
    }
    return {
        ...infoPlist,
        FacebookAdvertiserIDCollectionEnabled: facebookAdvertiserIDCollectionEnabled,
    };
}
exports.setFacebookAdvertiserIDCollectionEnabled = setFacebookAdvertiserIDCollectionEnabled;
function setFacebookAppId(config, { FacebookAppID, ...infoPlist }) {
    const facebookAppId = getFacebookAppId(config);
    if (facebookAppId) {
        return {
            ...infoPlist,
            FacebookAppID: facebookAppId,
        };
    }
    return infoPlist;
}
exports.setFacebookAppId = setFacebookAppId;
function setFacebookDisplayName(config, { FacebookDisplayName, ...infoPlist }) {
    const facebookDisplayName = getFacebookDisplayName(config);
    if (facebookDisplayName) {
        return {
            ...infoPlist,
            FacebookDisplayName: facebookDisplayName,
        };
    }
    return infoPlist;
}
exports.setFacebookDisplayName = setFacebookDisplayName;
function setFacebookApplicationQuerySchemes(config, infoPlist) {
    const facebookAppId = getFacebookAppId(config);
    const existingSchemes = infoPlist.LSApplicationQueriesSchemes || [];
    if (facebookAppId && existingSchemes.includes('fbapi')) {
        // already inlcuded, no need to add again
        return infoPlist;
    }
    else if (!facebookAppId && !existingSchemes.length) {
        // already removed, no need to strip again
        const { LSApplicationQueriesSchemes, ...restInfoPlist } = infoPlist;
        if (LSApplicationQueriesSchemes === null || LSApplicationQueriesSchemes === void 0 ? void 0 : LSApplicationQueriesSchemes.length) {
            return infoPlist;
        }
        else {
            // Return without the empty LSApplicationQueriesSchemes array.
            return restInfoPlist;
        }
    }
    // Remove all schemes
    for (const scheme of fbSchemes) {
        const index = existingSchemes.findIndex(s => s === scheme);
        if (index > -1) {
            existingSchemes.splice(index, 1);
        }
    }
    if (!facebookAppId) {
        // Run again to ensure the LSApplicationQueriesSchemes array is stripped if needed.
        infoPlist.LSApplicationQueriesSchemes = existingSchemes;
        if (!infoPlist.LSApplicationQueriesSchemes.length) {
            delete infoPlist.LSApplicationQueriesSchemes;
        }
        return infoPlist;
    }
    // TODO: it's actually necessary to add more query schemes (specific to the
    // app) to support all of the features that the Facebook SDK provides, should
    // we sync those here too?
    const updatedSchemes = [...existingSchemes, ...fbSchemes];
    return {
        ...infoPlist,
        LSApplicationQueriesSchemes: updatedSchemes,
    };
}
exports.setFacebookApplicationQuerySchemes = setFacebookApplicationQuerySchemes;
exports.withUserTrackingPermission = (config, { userTrackingPermission } = {}) => {
    if (userTrackingPermission === false) {
        return config;
    }
    if (!config.ios)
        config.ios = {};
    if (!config.ios.infoPlist)
        config.ios.infoPlist = {};
    config.ios.infoPlist.NSUserTrackingUsageDescription =
        userTrackingPermission || config.ios.infoPlist.NSUserTrackingUsageDescription || USER_TRACKING;
    return config;
};
