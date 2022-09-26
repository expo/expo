"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfig = void 0;
const ajv_1 = __importDefault(require("ajv"));
const semver_1 = __importDefault(require("semver"));
/**
 * The minimal supported versions. These values should align to SDK
 * @ignore
 */
const EXPO_SDK_MINIMAL_SUPPORTED_VERSIONS = {
    android: {
        minSdkVersion: 21,
        compileSdkVersion: 31,
        targetSdkVersion: 31,
        kotlinVersion: '1.6.10',
    },
    ios: {
        deploymentTarget: '13.0',
    },
};
const schema = {
    type: 'object',
    properties: {
        android: {
            type: 'object',
            properties: {
                minSdkVersion: { type: 'integer', nullable: true },
                compileSdkVersion: { type: 'integer', nullable: true },
                targetSdkVersion: { type: 'integer', nullable: true },
                buildToolsVersion: { type: 'string', nullable: true },
                kotlinVersion: { type: 'string', nullable: true },
                enableProguardInReleaseBuilds: { type: 'boolean', nullable: true },
                extraProguardRules: { type: 'string', nullable: true },
                packagingOptions: {
                    type: 'object',
                    properties: {
                        pickFirst: { type: 'array', items: { type: 'string' }, nullable: true },
                        exclude: { type: 'array', items: { type: 'string' }, nullable: true },
                        merge: { type: 'array', items: { type: 'string' }, nullable: true },
                        doNotStrip: { type: 'array', items: { type: 'string' }, nullable: true },
                    },
                    nullable: true,
                },
            },
            nullable: true,
        },
        ios: {
            type: 'object',
            properties: {
                deploymentTarget: { type: 'string', pattern: '\\d+\\.\\d+', nullable: true },
                useFrameworks: { type: 'string', enum: ['static', 'dynamic'], nullable: true },
            },
            nullable: true,
        },
    },
};
/**
 * Check versions to meet expo minimal supported versions.
 * Will throw error message whenever there are invalid versions.
 * For the implementation, we check items one by one because ajv does not well support custom error message.
 *
 * @param config the validated config passed from ajv
 * @ignore
 */
function maybeThrowInvalidVersions(config) {
    const checkItems = [
        {
            name: 'android.minSdkVersion',
            configVersion: config.android?.minSdkVersion,
            minimalVersion: EXPO_SDK_MINIMAL_SUPPORTED_VERSIONS.android.minSdkVersion,
        },
        {
            name: 'android.compileSdkVersion',
            configVersion: config.android?.compileSdkVersion,
            minimalVersion: EXPO_SDK_MINIMAL_SUPPORTED_VERSIONS.android.compileSdkVersion,
        },
        {
            name: 'android.targetSdkVersion',
            configVersion: config.android?.targetSdkVersion,
            minimalVersion: EXPO_SDK_MINIMAL_SUPPORTED_VERSIONS.android.targetSdkVersion,
        },
        {
            name: 'android.kotlinVersion',
            configVersion: config.android?.kotlinVersion,
            minimalVersion: EXPO_SDK_MINIMAL_SUPPORTED_VERSIONS.android.kotlinVersion,
        },
        {
            name: 'ios.deploymentTarget',
            configVersion: config.ios?.deploymentTarget,
            minimalVersion: EXPO_SDK_MINIMAL_SUPPORTED_VERSIONS.ios.deploymentTarget,
        },
    ];
    for (const { name, configVersion, minimalVersion } of checkItems) {
        if (typeof configVersion === 'number' &&
            typeof minimalVersion === 'number' &&
            configVersion < minimalVersion) {
            throw new Error(`\`${name}\` needs to be at least version ${minimalVersion}.`);
        }
        if (typeof configVersion === 'string' &&
            typeof minimalVersion === 'string' &&
            semver_1.default.lt(semver_1.default.coerce(configVersion) ?? '0.0.0', semver_1.default.coerce(minimalVersion) ?? '0.0.0')) {
            throw new Error(`\`${name}\` needs to be at least version ${minimalVersion}.`);
        }
    }
}
/**
 * @ignore
 */
function validateConfig(config) {
    const validate = new ajv_1.default().compile(schema);
    if (!validate(config)) {
        throw new Error('Invalid expo-build-properties config: ' + JSON.stringify(validate.errors));
    }
    maybeThrowInvalidVersions(config);
    return config;
}
exports.validateConfig = validateConfig;
