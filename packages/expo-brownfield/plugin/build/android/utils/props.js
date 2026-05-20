"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVersion = exports.getPublishing = exports.getProjectRoot = exports.getPackagePath = exports.getPluginConfig = void 0;
const config_plugins_1 = require("expo/config-plugins");
const node_path_1 = __importDefault(require("node:path"));
const validation_1 = require("./validation");
const getPluginConfig = (props, config) => {
    const libraryName = (0, validation_1.validateGradleField)('gradleProjectName', props?.libraryName || 'brownfield', 'android.libraryName');
    const packageId = (0, validation_1.validateGradleField)('javaPackage', getPackage(config, props), 'android.package');
    const group = (0, validation_1.validateGradleField)('javaPackage', getGroup(props, packageId), 'android.group');
    const version = (0, validation_1.validateGradleField)('mavenVersion', (0, exports.getVersion)(props), 'android.version');
    return {
        group,
        libraryName,
        package: packageId,
        packagePath: (0, exports.getPackagePath)(packageId),
        projectRoot: (0, exports.getProjectRoot)(config),
        publishing: validatePublishing((0, exports.getPublishing)(props)),
        version,
    };
};
exports.getPluginConfig = getPluginConfig;
const validatePublishing = (publications) => {
    return publications.map((publication, index) => {
        if (publication.type === 'localMaven') {
            return publication;
        }
        if (publication.name !== undefined) {
            (0, validation_1.validateGradleField)('groovyIdentifier', publication.name, `android.publishing[${index}].name`);
        }
        if (publication.type === 'localDirectory') {
            return publication;
        }
        if (typeof publication.url !== 'string') {
            (0, validation_1.validateGradleField)('envVarName', publication.url.variable, `android.publishing[${index}].url.variable`);
        }
        if (publication.type === 'remotePrivate') {
            if (typeof publication.username !== 'string') {
                (0, validation_1.validateGradleField)('envVarName', publication.username.variable, `android.publishing[${index}].username.variable`);
            }
            if (typeof publication.password !== 'string') {
                (0, validation_1.validateGradleField)('envVarName', publication.password.variable, `android.publishing[${index}].password.variable`);
            }
        }
        return {
            ...publication,
            allowInsecure: Boolean(publication.allowInsecure),
        };
    });
};
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
