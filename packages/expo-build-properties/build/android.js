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
        propName: 'android.compileSdkVersion',
        propValueGetter: (config) => { var _a, _b; return (_b = (_a = config.android) === null || _a === void 0 ? void 0 : _a.compileSdkVersion) === null || _b === void 0 ? void 0 : _b.toString(); },
    },
    {
        propName: 'android.targetSdkVersion',
        propValueGetter: (config) => { var _a, _b; return (_b = (_a = config.android) === null || _a === void 0 ? void 0 : _a.targetSdkVersion) === null || _b === void 0 ? void 0 : _b.toString(); },
    },
    {
        propName: 'android.buildToolsVersion',
        propValueGetter: (config) => { var _a; return (_a = config.android) === null || _a === void 0 ? void 0 : _a.buildToolsVersion; },
    },
    {
        propName: 'android.kotlinVersion',
        propValueGetter: (config) => { var _a; return (_a = config.android) === null || _a === void 0 ? void 0 : _a.kotlinVersion; },
    },
    {
        propName: 'android.packagingOptions.pickFirsts',
        propValueGetter: (config) => { var _a, _b, _c; return (_c = (_b = (_a = config.android) === null || _a === void 0 ? void 0 : _a.packagingOptions) === null || _b === void 0 ? void 0 : _b.pickFirst) === null || _c === void 0 ? void 0 : _c.join(','); },
    },
    {
        propName: 'android.packagingOptions.excludes',
        propValueGetter: (config) => { var _a, _b, _c; return (_c = (_b = (_a = config.android) === null || _a === void 0 ? void 0 : _a.packagingOptions) === null || _b === void 0 ? void 0 : _b.exclude) === null || _c === void 0 ? void 0 : _c.join(','); },
    },
    {
        propName: 'android.packagingOptions.merges',
        propValueGetter: (config) => { var _a, _b, _c; return (_c = (_b = (_a = config.android) === null || _a === void 0 ? void 0 : _a.packagingOptions) === null || _b === void 0 ? void 0 : _b.merge) === null || _c === void 0 ? void 0 : _c.join(','); },
    },
    {
        propName: 'android.packagingOptions.doNotStrip',
        propValueGetter: (config) => { var _a, _b, _c; return (_c = (_b = (_a = config.android) === null || _a === void 0 ? void 0 : _a.packagingOptions) === null || _b === void 0 ? void 0 : _b.doNotStrip) === null || _c === void 0 ? void 0 : _c.join(','); },
    },
    {
        propName: 'android.enableProguardInReleaseBuilds',
        propValueGetter: (config) => { var _a, _b; return (_b = (_a = config.android) === null || _a === void 0 ? void 0 : _a.enableProguardInReleaseBuilds) === null || _b === void 0 ? void 0 : _b.toString(); },
    },
], 'withAndroidBuildProperties');
/**
 * Appends `props.android.extraProguardRules` content into `android/app/proguard-rules.pro`
 */
const withAndroidProguardRules = (config, props) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        async (config) => {
            var _a, _b;
            const extraProguardRules = (_b = (_a = props.android) === null || _a === void 0 ? void 0 : _a.extraProguardRules) !== null && _b !== void 0 ? _b : null;
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
