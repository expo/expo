"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAndroidIntentFilters = exports.getIntentFilters = exports.withAndroidIntentFilters = void 0;
const Manifest_1 = require("./Manifest");
const android_plugins_1 = require("../plugins/android-plugins");
const GENERATED_TAG = 'data-generated';
exports.withAndroidIntentFilters = (0, android_plugins_1.createAndroidManifestPlugin)(setAndroidIntentFilters, 'withAndroidIntentFilters');
function getIntentFilters(config) {
    return config.android?.intentFilters ?? [];
}
exports.getIntentFilters = getIntentFilters;
function setAndroidIntentFilters(config, androidManifest) {
    // Always ensure old tags are removed.
    const mainActivity = (0, Manifest_1.getMainActivityOrThrow)(androidManifest);
    // Remove all generated tags from previous runs...
    if (mainActivity['intent-filter']?.length) {
        mainActivity['intent-filter'] = mainActivity['intent-filter'].filter((value) => value.$?.[GENERATED_TAG] !== 'true');
    }
    const intentFilters = getIntentFilters(config);
    if (!intentFilters.length) {
        return androidManifest;
    }
    mainActivity['intent-filter'] = mainActivity['intent-filter']?.concat(renderIntentFilters(intentFilters));
    return androidManifest;
}
exports.setAndroidIntentFilters = setAndroidIntentFilters;
function renderIntentFilters(intentFilters) {
    return intentFilters.map((intentFilter) => {
        // <intent-filter>
        return {
            $: {
                'android:autoVerify': intentFilter.autoVerify ? 'true' : undefined,
                // Add a custom "generated" tag that we can query later to remove.
                [GENERATED_TAG]: 'true',
            },
            action: [
                // <action android:name="android.intent.action.VIEW"/>
                {
                    $: {
                        'android:name': `android.intent.action.${intentFilter.action}`,
                    },
                },
            ],
            data: renderIntentFilterData(intentFilter.data),
            category: renderIntentFilterCategory(intentFilter.category),
        };
    });
}
exports.default = renderIntentFilters;
/** Like `<data android:scheme="exp"/>` */
function renderIntentFilterData(data) {
    return (Array.isArray(data) ? data : [data]).filter(Boolean).map((datum) => ({
        $: Object.entries(datum ?? {}).reduce((prev, [key, value]) => ({ ...prev, [`android:${key}`]: value }), {}),
    }));
}
/** Like `<category android:name="android.intent.category.DEFAULT"/>` */
function renderIntentFilterCategory(category) {
    return (Array.isArray(category) ? category : [category]).filter(Boolean).map((cat) => ({
        $: {
            'android:name': `android.intent.category.${cat}`,
        },
    }));
}
