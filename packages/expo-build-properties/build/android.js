"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAndroidProguardRules = exports.withAndroidProguardRules = exports.withAndroidBuildProperties = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const generateCode_1 = require("@expo/config-plugins/build/utils/generateCode");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const { createBuildGradlePropsConfigPlugin } = config_plugins_1.AndroidConfig.BuildProperties;
exports.withAndroidBuildProperties = createBuildGradlePropsConfigPlugin([
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
], 'withAndroidBuildProperties');
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
            const newContents = updateAndroidProguardRules(contents, extraProguardRules);
            if (newContents) {
                await fs_1.default.promises.writeFile(proguardRulesFile, newContents);
            }
            return config;
        },
    ]);
};
exports.withAndroidProguardRules = withAndroidProguardRules;
/**
 * Update `newProguardRules` to original `proguard-rules.pro` contents if needed
 *
 * @param contents the original `proguard-rules.pro` contents
 * @param newProguardRules new proguard rules to add. If the value is null, the generated proguard rules will be cleanup
 * @returns return string when results is updated or return null when nothing changed.
 */
function updateAndroidProguardRules(contents, newProguardRules) {
    const mergeTag = 'expo-build-properties';
    let mergeResults;
    if (newProguardRules) {
        mergeResults = (0, generateCode_1.mergeContents)({
            tag: mergeTag,
            src: contents,
            newSrc: newProguardRules,
            anchor: /^/,
            offset: contents.length,
            comment: '#',
        });
    }
    else {
        mergeResults = (0, generateCode_1.removeContents)({
            tag: mergeTag,
            src: contents,
        });
    }
    if (mergeResults.didMerge || mergeResults.didClear) {
        return mergeResults.contents;
    }
    return null;
}
exports.updateAndroidProguardRules = updateAndroidProguardRules;
