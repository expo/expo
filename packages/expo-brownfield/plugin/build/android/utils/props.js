"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVersion = exports.getPublishing = exports.getProjectRoot = exports.getPackagePath = exports.getPluginConfig = void 0;
const config_plugins_1 = require("expo/config-plugins");
const node_path_1 = __importDefault(require("node:path"));
const getPluginConfig = (props, config) => {
    const libraryName = props?.libraryName || 'brownfield';
    const packageId = getPackage(config, props);
    return {
        group: getGroup(props, packageId),
        libraryName,
        package: packageId,
        packagePath: (0, exports.getPackagePath)(packageId),
        projectRoot: (0, exports.getProjectRoot)(config),
        publishing: (0, exports.getPublishing)(props),
        version: (0, exports.getVersion)(props),
    };
};
exports.getPluginConfig = getPluginConfig;
const getGroup = (props, packageId) => {
    if (props?.group) {
        return props.group;
    }
    // Assumption: Correct package id in Java/Kotlin has at least one dot
    const lastDotIndex = packageId.lastIndexOf('.');
    return packageId.substring(0, lastDotIndex);
};
const getPackage = (config, props) => {
    if (props?.package) {
        return props.package;
    }
    if (config.android?.package) {
        return config.android.package + '.brownfield';
    }
    return 'com.example.brownfield';
};
const getPackagePath = (packageId) => {
    return node_path_1.default.join('java', ...packageId.split('.'));
};
exports.getPackagePath = getPackagePath;
const getProjectRoot = (config) => {
    let projectRoot = '';
    (0, config_plugins_1.withAndroidManifest)(config, (config) => {
        projectRoot = config.modRequest.projectRoot;
        return config;
    });
    if (!projectRoot && config._internal?.projectRoot) {
        projectRoot = config._internal.projectRoot;
    }
    return projectRoot;
};
exports.getProjectRoot = getProjectRoot;
const getPublishing = (props) => {
    return (props?.publishing || [
        {
            type: 'localMaven',
        },
    ]);
};
exports.getPublishing = getPublishing;
const getVersion = (props) => {
    return props?.version || '1.0.0';
};
exports.getVersion = getVersion;
