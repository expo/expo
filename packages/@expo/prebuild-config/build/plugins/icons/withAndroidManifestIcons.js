"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRoundIconManifest = exports.withAndroidManifestIcons = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const withAndroidManifestIcons = (config) => (0, config_plugins_1.withAndroidManifest)(config, (config) => {
    config.modResults = setRoundIconManifest(config, config.modResults);
    return config;
});
exports.withAndroidManifestIcons = withAndroidManifestIcons;
function setRoundIconManifest(config, manifest) {
    const isAdaptive = !!config.android?.adaptiveIcon;
    const application = config_plugins_1.AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    if (isAdaptive) {
        application.$['android:roundIcon'] = '@mipmap/ic_launcher_round';
    }
    else {
        delete application.$['android:roundIcon'];
    }
    return manifest;
}
exports.setRoundIconManifest = setRoundIconManifest;
