"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeExpoSchemaFromVerifiedIntentFilters = exports.setGeneratedAndroidScheme = exports.withGeneratedAndroidScheme = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const getDefaultScheme_1 = __importDefault(require("./getDefaultScheme"));
const withGeneratedAndroidScheme = (config) => {
    return (0, config_plugins_1.withAndroidManifest)(config, (config) => {
        config.modResults = setGeneratedAndroidScheme(config, config.modResults);
        config.modResults = removeExpoSchemaFromVerifiedIntentFilters(config, config.modResults);
        return config;
    });
};
exports.withGeneratedAndroidScheme = withGeneratedAndroidScheme;
function setGeneratedAndroidScheme(config, androidManifest) {
    // Generate a cross-platform scheme used to launch the dev client.
    const scheme = (0, getDefaultScheme_1.default)(config);
    if (!config_plugins_1.AndroidConfig.Scheme.hasScheme(scheme, androidManifest)) {
        androidManifest = config_plugins_1.AndroidConfig.Scheme.appendScheme(scheme, androidManifest);
    }
    return androidManifest;
}
exports.setGeneratedAndroidScheme = setGeneratedAndroidScheme;
/**
 * Remove the custom Expo dev client scheme from intent filters, which are set to `autoVerify=true`.
 * The custom scheme `<data android:scheme="exp+<slug>"/>` seems to block verification for these intent filters.
 * This plugin makes sure there is no scheme in the autoVerify intent filters, that starts with `exp+`.
 
 * Iterate over all `autoVerify=true` intent filters, and pull out schemes matching with `exp+<slug>`.
 *
 * @param {AndroidManifest} androidManifest
 */
function removeExpoSchemaFromVerifiedIntentFilters(config, androidManifest) {
    // Generate a cross-platform scheme used to launch the dev client.
    const defaultScheme = (0, getDefaultScheme_1.default)(config);
    // see: https://github.com/expo/expo-cli/blob/f1624c75b52cc1c4f99354ec4021494e0eff74aa/packages/config-plugins/src/android/Scheme.ts#L164-L179
    for (const application of androidManifest.manifest.application || []) {
        for (const activity of application.activity || []) {
            if (activityHasSingleTaskLaunchMode(activity)) {
                for (const intentFilter of activity['intent-filter'] || []) {
                    if (intentFilterHasAutoVerification(intentFilter) && intentFilter?.data) {
                        intentFilter.data = intentFilterRemoveSchemeFromData(intentFilter, (scheme) => scheme === defaultScheme);
                    }
                }
                break;
            }
        }
    }
    return androidManifest;
}
exports.removeExpoSchemaFromVerifiedIntentFilters = removeExpoSchemaFromVerifiedIntentFilters;
/**
 * Determine if the activity should contain the intent filters to clean.
 *
 * @see https://github.com/expo/expo-cli/blob/f1624c75b52cc1c4f99354ec4021494e0eff74aa/packages/config-plugins/src/android/Scheme.ts#L166
 */
function activityHasSingleTaskLaunchMode(activity) {
    return activity?.$?.['android:launchMode'] === 'singleTask';
}
/**
 * Determine if the intent filter has `autoVerify=true`.
 */
function intentFilterHasAutoVerification(intentFilter) {
    return intentFilter?.$?.['android:autoVerify'] === 'true';
}
/**
 * Remove schemes from the intent filter that matches the function.
 */
function intentFilterRemoveSchemeFromData(intentFilter, schemeMatcher) {
    return intentFilter?.data?.filter((entry) => !schemeMatcher(entry?.$['android:scheme'] || ''));
}
