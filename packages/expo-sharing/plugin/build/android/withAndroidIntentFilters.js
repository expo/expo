"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAndroidIntentFilters = void 0;
exports.setAndroidIntentFilters = setAndroidIntentFilters;
exports.default = renderIntentFilters;
const config_plugins_1 = require("@expo/config-plugins");
const SHARING_GENERATED_TAG = 'expo-sharing-intent-filters';
const withAndroidIntentFilters = (config, { intentFilters }) => {
    return (0, config_plugins_1.withAndroidManifest)(config, (config) => {
        setAndroidIntentFilters(config, intentFilters);
        return config;
    });
};
exports.withAndroidIntentFilters = withAndroidIntentFilters;
function setAndroidIntentFilters(config, intentFilters) {
    const mainActivity = config_plugins_1.AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);
    // Remove all generated tags from previous runs...
    if (mainActivity['intent-filter']?.length) {
        mainActivity['intent-filter'] = mainActivity['intent-filter'].filter(
        // @ts-ignore
        (value) => value.$?.[SHARING_GENERATED_TAG] !== 'true');
    }
    if (!intentFilters.length) {
        return config;
    }
    mainActivity['intent-filter'] = mainActivity['intent-filter']?.concat(renderIntentFilters(intentFilters));
    return config;
}
function renderIntentFilters(intentFilters) {
    return intentFilters.map((intentFilter) => ({
        $: {
            'android:autoVerify': 'false',
            // Add a custom "generated" tag that we can query later to remove.
            [SHARING_GENERATED_TAG]: 'true',
        },
        action: [
            // <action android:name="android.intent.action.SEND"/> or SEND_MULTIPLE
            {
                $: {
                    'android:name': intentFilter.action,
                },
            },
        ],
        data: renderIntentFilterData(intentFilter.data),
        category: [
            {
                $: {
                    'android:name': intentFilter.category,
                },
            },
        ],
    }));
}
/** Like `<data android:scheme="exp"/>` */
function renderIntentFilterData(data) {
    return (Array.isArray(data) ? data : [data]).filter(Boolean).map((datum) => ({
        $: Object.entries(datum ?? {}).reduce((prev, [key, value]) => ({ ...prev, [`android:${key}`]: value }), {}),
    }));
}
