"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchemesFromPlist = exports.hasScheme = exports.removeScheme = exports.appendScheme = exports.setScheme = exports.getScheme = exports.withScheme = void 0;
const ios_plugins_1 = require("../plugins/ios-plugins");
exports.withScheme = (0, ios_plugins_1.createInfoPlistPluginWithPropertyGuard)(setScheme, {
    infoPlistProperty: 'CFBundleURLTypes',
    expoConfigProperty: 'scheme',
}, 'withScheme');
function getScheme(config) {
    if (Array.isArray(config.scheme)) {
        const validate = (value) => {
            return typeof value === 'string';
        };
        return config.scheme.filter(validate);
    }
    else if (typeof config.scheme === 'string') {
        return [config.scheme];
    }
    return [];
}
exports.getScheme = getScheme;
function setScheme(config, infoPlist) {
    const scheme = [
        ...getScheme(config),
        // @ts-ignore: TODO: ios.scheme is an unreleased -- harder to add to turtle v1.
        ...getScheme(config.ios ?? {}),
    ];
    // Add the bundle identifier to the list of schemes for easier Google auth and parity with Turtle v1.
    if (config.ios?.bundleIdentifier) {
        scheme.push(config.ios.bundleIdentifier);
    }
    if (scheme.length === 0) {
        return infoPlist;
    }
    return {
        ...infoPlist,
        CFBundleURLTypes: [{ CFBundleURLSchemes: scheme }],
    };
}
exports.setScheme = setScheme;
function appendScheme(scheme, infoPlist) {
    if (!scheme) {
        return infoPlist;
    }
    const existingSchemes = infoPlist.CFBundleURLTypes ?? [];
    if (existingSchemes?.some(({ CFBundleURLSchemes }) => CFBundleURLSchemes.includes(scheme))) {
        return infoPlist;
    }
    return {
        ...infoPlist,
        CFBundleURLTypes: [
            ...existingSchemes,
            {
                CFBundleURLSchemes: [scheme],
            },
        ],
    };
}
exports.appendScheme = appendScheme;
function removeScheme(scheme, infoPlist) {
    if (!scheme) {
        return infoPlist;
    }
    // No need to remove if we don't have any
    if (!infoPlist.CFBundleURLTypes) {
        return infoPlist;
    }
    infoPlist.CFBundleURLTypes = infoPlist.CFBundleURLTypes.map((bundleUrlType) => {
        const index = bundleUrlType.CFBundleURLSchemes.indexOf(scheme);
        if (index > -1) {
            bundleUrlType.CFBundleURLSchemes.splice(index, 1);
            if (bundleUrlType.CFBundleURLSchemes.length === 0) {
                return undefined;
            }
        }
        return bundleUrlType;
    }).filter(Boolean);
    return infoPlist;
}
exports.removeScheme = removeScheme;
function hasScheme(scheme, infoPlist) {
    const existingSchemes = infoPlist.CFBundleURLTypes;
    if (!Array.isArray(existingSchemes))
        return false;
    return existingSchemes?.some(({ CFBundleURLSchemes: schemes }) => Array.isArray(schemes) ? schemes.includes(scheme) : false);
}
exports.hasScheme = hasScheme;
function getSchemesFromPlist(infoPlist) {
    if (Array.isArray(infoPlist.CFBundleURLTypes)) {
        return infoPlist.CFBundleURLTypes.reduce((schemes, { CFBundleURLSchemes }) => {
            if (Array.isArray(CFBundleURLSchemes)) {
                return [...schemes, ...CFBundleURLSchemes];
            }
            return schemes;
        }, []);
    }
    return [];
}
exports.getSchemesFromPlist = getSchemesFromPlist;
