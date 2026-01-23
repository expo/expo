"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveConfigValue = resolveConfigValue;
exports.validateConfig = validateConfig;
const schema_utils_1 = require("@expo/schema-utils");
const fs_1 = __importDefault(require("fs"));
const resolve_from_1 = __importDefault(require("resolve-from"));
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
        deploymentTarget: '15.1',
    },
};
/**
 * The hermes-compiler version expected to use hermesV1 compiler version.
 * Keep this in sync with the expected `react-native` version.
 * @ignore
 */
const HERMES_V1_COMPILER_VERSION = '250829098.0.4';
/**
 * Resolves a shared config value with platform-specific override.
 * Platform-specific values take precedence over top-level values.
 */
function resolveConfigValue(config, platform, key) {
    return config[platform]?.[key] ?? config[key];
}
const schema = {
    title: 'expo-build-properties',
    type: 'object',
    properties: {
        buildReactNativeFromSource: { type: 'boolean', nullable: true },
        reactNativeReleaseLevel: {
            type: 'string',
            enum: ['stable', 'canary', 'experimental'],
            nullable: true,
        },
        useHermesV1: { type: 'boolean', nullable: true },
        android: {
            type: 'object',
            properties: {
                minSdkVersion: { type: 'integer', nullable: true },
                compileSdkVersion: { type: 'integer', nullable: true },
                targetSdkVersion: { type: 'integer', nullable: true },
                buildToolsVersion: { type: 'string', nullable: true },
                kotlinVersion: { type: 'string', nullable: true },
                enableMinifyInReleaseBuilds: { type: 'boolean', nullable: true },
                enableShrinkResourcesInReleaseBuilds: { type: 'boolean', nullable: true },
                enablePngCrunchInReleaseBuilds: { type: 'boolean', nullable: true },
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
                networkInspector: { type: 'boolean', nullable: true },
                extraMavenRepos: {
                    type: 'array',
                    items: {
                        type: ['string', 'object'],
                        anyOf: [
                            { type: 'string', nullable: false },
                            {
                                type: 'object',
                                required: ['url'],
                                properties: {
                                    url: { type: 'string', nullable: false },
                                    credentials: {
                                        type: 'object',
                                        oneOf: [
                                            {
                                                type: 'object',
                                                properties: {
                                                    username: { type: 'string' },
                                                    password: { type: 'string' },
                                                },
                                                required: ['username', 'password'],
                                                additionalProperties: false,
                                            },
                                            {
                                                type: 'object',
                                                properties: {
                                                    name: { type: 'string' },
                                                    value: { type: 'string' },
                                                },
                                                required: ['name', 'value'],
                                                additionalProperties: false,
                                            },
                                            {
                                                type: 'object',
                                                properties: {
                                                    accessKey: { type: 'string' },
                                                    secretKey: { type: 'string' },
                                                    sessionToken: { type: 'string', nullable: true },
                                                },
                                                required: ['accessKey', 'secretKey'],
                                                additionalProperties: false,
                                            },
                                        ],
                                        nullable: true,
                                    },
                                    authentication: {
                                        type: 'string',
                                        enum: ['basic', 'digest', 'header'],
                                        nullable: true,
                                    },
                                },
                                additionalProperties: false,
                            },
                        ],
                    },
                    nullable: true,
                },
                usesCleartextTraffic: { type: 'boolean', nullable: true },
                useLegacyPackaging: { type: 'boolean', nullable: true },
                useDayNightTheme: { type: 'boolean', nullable: true },
                manifestQueries: {
                    type: 'object',
                    properties: {
                        package: { type: 'array', items: { type: 'string' }, minItems: 1, nullable: true },
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
                        provider: { type: 'array', items: { type: 'string' }, minItems: 1, nullable: true },
                    },
                    nullable: true,
                },
                enableBundleCompression: { type: 'boolean', nullable: true },
                buildFromSource: { type: 'boolean', nullable: true },
                buildReactNativeFromSource: { type: 'boolean', nullable: true },
                buildArchs: { type: 'array', items: { type: 'string' }, nullable: true },
                exclusiveMavenMirror: { type: 'string', nullable: true },
                reactNativeReleaseLevel: {
                    type: 'string',
                    enum: ['stable', 'canary', 'experimental'],
                    nullable: true,
                },
                useHermesV1: { type: 'boolean', nullable: true },
            },
            nullable: true,
        },
        ios: {
            type: 'object',
            properties: {
                deploymentTarget: { type: 'string', pattern: '\\d+\\.\\d+', nullable: true },
                useFrameworks: { type: 'string', enum: ['static', 'dynamic'], nullable: true },
                forceStaticLinking: { type: 'array', items: { type: 'string' }, nullable: true },
                networkInspector: { type: 'boolean', nullable: true },
                ccacheEnabled: { type: 'boolean', nullable: true },
                privacyManifestAggregationEnabled: { type: 'boolean', nullable: true },
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
                buildReactNativeFromSource: { type: 'boolean', nullable: true },
                reactNativeReleaseLevel: {
                    type: 'string',
                    enum: ['stable', 'canary', 'experimental'],
                    nullable: true,
                },
                useHermesV1: { type: 'boolean', nullable: true },
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
/** Handle deprecated enableProguardInReleaseBuilds */
const fixupDeprecatedEnableProguardInReleaseBuilds = (config) => {
    if (config &&
        typeof config === 'object' &&
        'android' in config &&
        config.android &&
        typeof config.android === 'object') {
        const androidConfig = config.android;
        if (androidConfig.enableProguardInReleaseBuilds != null) {
            if (androidConfig.enableMinifyInReleaseBuilds === undefined) {
                androidConfig.enableMinifyInReleaseBuilds = !!androidConfig.enableProguardInReleaseBuilds;
            }
        }
    }
};
/**
 * Reads the hermes-compiler version from node_modules
 * @ignore
 */
function getHermesCompilerVersion(projectRoot) {
    const hermesCompilerPackageJsonPath = resolve_from_1.default.silent(resolve_from_1.default.silent(projectRoot, 'react-native/package.json') ?? projectRoot, 'hermes-compiler/package.json');
    if (!hermesCompilerPackageJsonPath || !fs_1.default.existsSync(hermesCompilerPackageJsonPath)) {
        return null;
    }
    try {
        const packageJson = JSON.parse(fs_1.default.readFileSync(hermesCompilerPackageJsonPath, 'utf8'));
        return packageJson.version ?? null;
    }
    catch {
        return null;
    }
}
/**
 * @ignore
 */
function validateConfig(config, projectRoot) {
    fixupDeprecatedEnableProguardInReleaseBuilds(config);
    (0, schema_utils_1.validate)(schema, config);
    maybeThrowInvalidVersions(config);
    if (config.android?.enableShrinkResourcesInReleaseBuilds === true &&
        config.android?.enableMinifyInReleaseBuilds !== true) {
        throw new Error('`android.enableShrinkResourcesInReleaseBuilds` requires `android.enableMinifyInReleaseBuilds` to be enabled.');
    }
    const androidUseHermesV1 = resolveConfigValue(config, 'android', 'useHermesV1');
    const iosUseHermesV1 = resolveConfigValue(config, 'ios', 'useHermesV1');
    // Hermes v1 requires a specific hermes-compiler version
    if ((androidUseHermesV1 || iosUseHermesV1) && projectRoot) {
        const hermesCompilerVersion = getHermesCompilerVersion(projectRoot);
        if (hermesCompilerVersion !== HERMES_V1_COMPILER_VERSION) {
            throw new Error(`\`useHermesV1\` requires setting the hermes-compiler version to ${HERMES_V1_COMPILER_VERSION} through resolutions. ` +
                (hermesCompilerVersion
                    ? `Found version "${hermesCompilerVersion}" instead.`
                    : 'hermes-compiler dependency not found.'));
        }
    }
    // Validate useHermesV1 requires buildReactNativeFromSource for Android
    const androidBuildFromSource = resolveConfigValue(config, 'android', 'buildReactNativeFromSource') ??
        config.android?.buildFromSource; // Deprecated fallback
    if (androidUseHermesV1 === true && androidBuildFromSource !== true) {
        throw new Error('`useHermesV1` requires `buildReactNativeFromSource` to be `true` for Android.');
    }
    // Validate useHermesV1 requires buildReactNativeFromSource for iOS
    const iosBuildFromSource = resolveConfigValue(config, 'ios', 'buildReactNativeFromSource');
    if (iosUseHermesV1 === true && iosBuildFromSource !== true) {
        throw new Error('`useHermesV1` requires `buildReactNativeFromSource` to be `true` for iOS.');
    }
    return config;
}
