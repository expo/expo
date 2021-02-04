"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAndroidManifestFeatures = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const pkg = require('expo-sensors/package.json');
const MOTION_USAGE = 'Allow $(PRODUCT_NAME) to access your device motion';
const withSensors = (config, { motionPermission } = {}) => {
    if (!config.ios)
        config.ios = {};
    if (!config.ios.infoPlist)
        config.ios.infoPlist = {};
    config.ios.infoPlist.NSMotionUsageDescription =
        motionPermission || config.ios.infoPlist.NSMotionUsageDescription || MOTION_USAGE;
    return withAndroidFeature(config);
};
const withAndroidFeature = config => {
    return config_plugins_1.withAndroidManifest(config, config => {
        config.modResults = setAndroidManifestFeatures(config.modResults);
        return config;
    });
};
/**
 * Add the following to the AndroidManifest.xml <uses-feature android:name="android.hardware.sensor.compass" android:required="true" />
 *
 * @param androidManifest
 */
function setAndroidManifestFeatures(androidManifest) {
    if (!Array.isArray(androidManifest.manifest['uses-feature'])) {
        androidManifest.manifest['uses-feature'] = [];
    }
    if (!androidManifest.manifest['uses-feature'].find(feature => feature.$['android:name'] === 'android.hardware.sensor.compass')) {
        androidManifest.manifest['uses-feature'].push({
            $: {
                'android:name': 'android.hardware.sensor.compass',
                'android:required': 'true',
            },
        });
    }
    return androidManifest;
}
exports.setAndroidManifestFeatures = setAndroidManifestFeatures;
exports.default = config_plugins_1.createRunOncePlugin(withSensors, pkg.name, pkg.version);
