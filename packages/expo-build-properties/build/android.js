"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAndroidQueries = exports.withAndroidCleartextTraffic = exports.updateAndroidProguardRules = exports.withAndroidPurgeProguardRulesOnce = exports.withAndroidProguardRules = exports.withAndroidFlipper = exports.withAndroidBuildProperties = void 0;
const config_plugins_1 = require("expo/config-plugins");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const androidQueryUtils_1 = require("./androidQueryUtils");
const fileContentsUtils_1 = require("./fileContentsUtils");
const { createBuildGradlePropsConfigPlugin } = config_plugins_1.AndroidConfig.BuildProperties;
exports.withAndroidBuildProperties = createBuildGradlePropsConfigPlugin([
    {
        propName: 'newArchEnabled',
        propValueGetter: (config) => config.android?.newArchEnabled?.toString(),
    },
    {
        propName: 'android.minSdkVersion',
        propValueGetter: (config) => config.android?.minSdkVersion?.toString(),
    },
    {
        propName: 'android.compileSdkVersion',
        propValueGetter: (config) => config.android?.compileSdkVersion?.toString(),
    },
    {
        propName: 'android.targetSdkVersion',
        propValueGetter: (config) => config.android?.targetSdkVersion?.toString(),
    },
    {
        propName: 'android.buildToolsVersion',
        propValueGetter: (config) => config.android?.buildToolsVersion,
    },
    {
        propName: 'android.kotlinVersion',
        propValueGetter: (config) => config.android?.kotlinVersion,
    },
    {
        propName: 'android.packagingOptions.pickFirsts',
        propValueGetter: (config) => config.android?.packagingOptions?.pickFirst?.join(','),
    },
    {
        propName: 'android.packagingOptions.excludes',
        propValueGetter: (config) => config.android?.packagingOptions?.exclude?.join(','),
    },
    {
        propName: 'android.packagingOptions.merges',
        propValueGetter: (config) => config.android?.packagingOptions?.merge?.join(','),
    },
    {
        propName: 'android.packagingOptions.doNotStrip',
        propValueGetter: (config) => config.android?.packagingOptions?.doNotStrip?.join(','),
    },
    {
        propName: 'android.enableProguardInReleaseBuilds',
        propValueGetter: (config) => config.android?.enableProguardInReleaseBuilds?.toString(),
    },
    {
        propName: 'android.enableShrinkResourcesInReleaseBuilds',
        propValueGetter: (config) => config.android?.enableShrinkResourcesInReleaseBuilds?.toString(),
    },
    {
        propName: 'EX_DEV_CLIENT_NETWORK_INSPECTOR',
        propValueGetter: (config) => (config.android?.networkInspector ?? true).toString(),
    },
    {
        propName: 'expo.useLegacyPackaging',
        propValueGetter: (config) => (config.android?.useLegacyPackaging ?? false).toString(),
    },
], 'withAndroidBuildProperties');
const withAndroidFlipper = (config, props) => {
    const ANDROID_FLIPPER_KEY = 'FLIPPER_VERSION';
    const FLIPPER_FALLBACK = '0.125.0';
    // when not set, make no changes
    if (props.android?.flipper === undefined) {
        return config;
    }
    return (0, config_plugins_1.withGradleProperties)(config, (c) => {
        // check for Flipper version in package. If set, use that
        let existing;
        const found = c.modResults.find((item) => item.type === 'property' && item.key === ANDROID_FLIPPER_KEY);
        if (found && found.type === 'property') {
            existing = found.value;
        }
        // strip key and re-add based on setting
        c.modResults = c.modResults.filter((item) => !(item.type === 'property' && item.key === ANDROID_FLIPPER_KEY));
        c.modResults.push({
            type: 'property',
            key: ANDROID_FLIPPER_KEY,
            value: (props.android?.flipper ?? existing ?? FLIPPER_FALLBACK),
        });
        return c;
    });
};
exports.withAndroidFlipper = withAndroidFlipper;
/**
 * Appends `props.android.extraProguardRules` content into `android/app/proguard-rules.pro`
 */
const withAndroidProguardRules = (config, props) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        async (config) => {
            const extraProguardRules = props.android?.extraProguardRules ?? null;
            const proguardRulesFile = path_1.default.join(config.modRequest.platformProjectRoot, 'app', 'proguard-rules.pro');
            const contents = await fs_1.default.promises.readFile(proguardRulesFile, 'utf8');
            const newContents = updateAndroidProguardRules(contents, extraProguardRules, 'append');
            if (contents !== newContents) {
                await fs_1.default.promises.writeFile(proguardRulesFile, newContents);
            }
            return config;
        },
    ]);
};
exports.withAndroidProguardRules = withAndroidProguardRules;
/**
 * Purge generated proguard contents from previous prebuild.
 * This plugin only runs once in the prebuilding phase and should execute before any `withAndroidProguardRules` calls.
 */
const withAndroidPurgeProguardRulesOnce = (config) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        async (config) => {
            const RUN_ONCE_NAME = 'expo-build-properties-android-purge-proguard-rules-once';
            /**
             * The `withRunOnce` plugin will delay this plugin's execution.
             * To make sure this plugin executes before any `withAndroidProguardRules`.
             * We use the `withRunOnce` internal History functions to do the check.
             * Example calls to demonstrate the case:
             * ```ts
             * config = withBuildProperties(config as ExpoConfig, {
             *   android: {
             *     kotlinVersion: "1.6.10",
             *   },
             * });
             * config = withBuildProperties(config as ExpoConfig, {
             *   android: {
             *     enableProguardInReleaseBuilds: true,
             *     extraProguardRules: "-keep class com.mycompany.** { *; }",
             *   },
             * });
             * ```
             */
            if (config_plugins_1.History.getHistoryItem(config, RUN_ONCE_NAME)) {
                return config;
            }
            else {
                config_plugins_1.History.addHistoryItem(config, { name: RUN_ONCE_NAME });
            }
            const proguardRulesFile = path_1.default.join(config.modRequest.platformProjectRoot, 'app', 'proguard-rules.pro');
            const contents = await fs_1.default.promises.readFile(proguardRulesFile, 'utf8');
            const newContents = updateAndroidProguardRules(contents, '', 'overwrite');
            if (contents !== newContents) {
                await fs_1.default.promises.writeFile(proguardRulesFile, newContents);
            }
            return config;
        },
    ]);
};
exports.withAndroidPurgeProguardRulesOnce = withAndroidPurgeProguardRulesOnce;
/**
 * Update `newProguardRules` to original `proguard-rules.pro` contents if needed
 *
 * @param contents the original `proguard-rules.pro` contents
 * @param newProguardRules new proguard rules to add. If the value is null, the returned value will be original `contents`.
 * @returns return updated contents
 */
function updateAndroidProguardRules(contents, newProguardRules, updateMode) {
    if (newProguardRules == null) {
        return contents;
    }
    const options = { tag: 'expo-build-properties', commentPrefix: '#' };
    let newContents = contents;
    if (updateMode === 'overwrite') {
        newContents = (0, fileContentsUtils_1.purgeContents)(contents, options);
    }
    if (newProguardRules !== '') {
        newContents = (0, fileContentsUtils_1.appendContents)(newContents, newProguardRules, options);
    }
    return newContents;
}
exports.updateAndroidProguardRules = updateAndroidProguardRules;
const withAndroidCleartextTraffic = (config, props) => {
    return (0, config_plugins_1.withAndroidManifest)(config, (config) => {
        if (props.android?.usesCleartextTraffic == null) {
            return config;
        }
        config.modResults = setUsesCleartextTraffic(config.modResults, props.android?.usesCleartextTraffic);
        return config;
    });
};
exports.withAndroidCleartextTraffic = withAndroidCleartextTraffic;
function setUsesCleartextTraffic(androidManifest, value) {
    const mainApplication = config_plugins_1.AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);
    if (mainApplication?.$) {
        mainApplication.$['android:usesCleartextTraffic'] = String(value);
    }
    return androidManifest;
}
const withAndroidQueries = (config, props) => {
    return (0, config_plugins_1.withAndroidManifest)(config, (config) => {
        if (props.android?.manifestQueries == null) {
            return config;
        }
        const { manifestQueries } = props.android;
        // Default template adds a single intent to the `queries` tag
        const defaultIntents = config.modResults.manifest.queries.map((q) => q.intent ?? []).flat() ?? [];
        const additionalQueries = {
            package: (0, androidQueryUtils_1.renderQueryPackages)(manifestQueries.package),
            intent: [...defaultIntents, ...(0, androidQueryUtils_1.renderQueryIntents)(manifestQueries.intent)],
        };
        const provider = (0, androidQueryUtils_1.renderQueryProviders)(manifestQueries.provider);
        if (provider != null) {
            additionalQueries.provider = provider;
        }
        config.modResults.manifest.queries = [additionalQueries];
        return config;
    });
};
exports.withAndroidQueries = withAndroidQueries;
