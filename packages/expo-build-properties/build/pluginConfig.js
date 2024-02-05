"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfig = void 0;
const ajv_1 = __importDefault(require("ajv"));
const semver_1 = __importDefault(require("semver"));
/**
 * The minimal supported versions. These values should align to SDK.
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
        deploymentTarget: '13.4',
    },
};
const schema = {
    type: 'object',
    properties: {
        android: {
            type: 'object',
            properties: {
                newArchEnabled: { type: 'boolean', nullable: true },
                minSdkVersion: { type: 'integer', nullable: true },
                compileSdkVersion: { type: 'integer', nullable: true },
                targetSdkVersion: { type: 'integer', nullable: true },
                buildToolsVersion: { type: 'string', nullable: true },
                kotlinVersion: { type: 'string', nullable: true },
                enableProguardInReleaseBuilds: { type: 'boolean', nullable: true },
                enableShrinkResourcesInReleaseBuilds: { type: 'boolean', nullable: true },
                extraProguardRules: { type: 'string', nullable: true },
                flipper: {
                    type: 'string',
                    nullable: true,
                },
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
                networkInspector: { type: 'boolean', nullable: true },
                extraMavenRepos: { type: 'array', items: { type: 'string' }, nullable: true },
                usesCleartextTraffic: { type: 'boolean', nullable: true },
                useLegacyPackaging: { type: 'boolean', nullable: true },
                manifestQueries: {
                    required: ['package'],
                    type: 'object',
                    properties: {
                        package: { type: 'array', items: { type: 'string' }, minItems: 1, nullable: false },
                        intent: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    action: { type: 'string', nullable: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            scheme: { type: 'string', nullable: true },
                                            host: { type: 'string', nullable: true },
                                            mimeType: { type: 'string', nullable: true },
                                        },
                                        nullable: true,
                                    },
                                    category: { type: 'array', items: { type: 'string' }, nullable: true },
                                },
                            },
                            nullable: true,
                        },
                        provider: { type: 'array', items: { type: 'string' }, nullable: true },
                    },
                    nullable: true,
                },
            },
            nullable: true,
        },
        ios: {
            type: 'object',
            properties: {
                newArchEnabled: { type: 'boolean', nullable: true },
                deploymentTarget: { type: 'string', pattern: '\\d+\\.\\d+', nullable: true },
                useFrameworks: { type: 'string', enum: ['static', 'dynamic'], nullable: true },
                flipper: {
                    type: ['boolean', 'string'],
                    nullable: true,
                },
                networkInspector: { type: 'boolean', nullable: true },
                extraPods: {
                    type: 'array',
                    items: {
                        type: 'object',
                        required: ['name'],
                        properties: {
                            name: { type: 'string' },
                            version: { type: 'string', nullable: true },
                            configurations: { type: 'array', items: { type: 'string' }, nullable: true },
                            modular_headers: { type: 'boolean', nullable: true },
                            source: { type: 'string', nullable: true },
                            path: { type: 'string', nullable: true },
                            podspec: { type: 'string', nullable: true },
                            testspecs: { type: 'array', items: { type: 'string' }, nullable: true },
                            git: { type: 'string', nullable: true },
                            branch: { type: 'string', nullable: true },
                            tag: { type: 'string', nullable: true },
                            commit: { type: 'string', nullable: true },
                        },
                    },
                    nullable: true,
                },
            },
            nullable: true,
        },
    },
};
// note(Kudo): For the implementation, we check items one by one because Ajv does not well support custom error message.
/**
 * Checks if specified versions meets Expo minimal supported versions.
 * Will throw error message whenever there are invalid versions.
 *
 * @param config The validated config passed from Ajv.
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
    const validate = new ajv_1.default({ allowUnionTypes: true }).compile(schema);
    if (!validate(config)) {
        throw new Error('Invalid expo-build-properties config: ' + JSON.stringify(validate.errors));
    }
    maybeThrowInvalidVersions(config);
    // explicitly block using use_frameworks and Flipper in iOS
    // https://github.com/facebook/flipper/issues/2414
    if (Boolean(config.ios?.flipper) && config.ios?.useFrameworks !== undefined) {
        throw new Error('`ios.flipper` cannot be enabled when `ios.useFrameworks` is set.');
    }
    if (config.android?.enableShrinkResourcesInReleaseBuilds === true &&
        config.android?.enableProguardInReleaseBuilds !== true) {
        throw new Error('`android.enableShrinkResourcesInReleaseBuilds` requires `android.enableProguardInReleaseBuilds` to be enabled.');
    }
    return config;
}
exports.validateConfig = validateConfig;
