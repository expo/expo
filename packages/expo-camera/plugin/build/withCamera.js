"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('../../package.json');
const CAMERA_USAGE = 'Allow $(PRODUCT_NAME) to access your camera';
const MICROPHONE_USAGE = 'Allow $(PRODUCT_NAME) to access your microphone';
const BARCODE_SCANNER_KEY = 'expo.camera.barcode-scanner-enabled';
const withCamera = (config, { cameraPermission, microphonePermission, recordAudioAndroid = true, barcodeScannerEnabled = true, } = {}) => {
    config_plugins_1.IOSConfig.Permissions.createPermissionsPlugin({
        NSCameraUsageDescription: CAMERA_USAGE,
        NSMicrophoneUsageDescription: MICROPHONE_USAGE,
    })(config, {
        NSCameraUsageDescription: cameraPermission,
        NSMicrophoneUsageDescription: microphonePermission,
    });
    config = (0, config_plugins_1.withPodfileProperties)(config, (config) => {
        if (barcodeScannerEnabled === false) {
            config.modResults[BARCODE_SCANNER_KEY] = 'false';
        }
        else {
            delete config.modResults[BARCODE_SCANNER_KEY];
        }
        return config;
    });
    config = (0, config_plugins_1.withGradleProperties)(config, (config) => {
        config.modResults = config_plugins_1.AndroidConfig.BuildProperties.updateAndroidBuildProperty(config.modResults, BARCODE_SCANNER_KEY, barcodeScannerEnabled === false ? 'false' : null, { removePropWhenValueIsNull: true });
        return config;
    });
    config = config_plugins_1.AndroidConfig.Permissions.withPermissions(config, [
        'android.permission.CAMERA',
        // Optional
        recordAudioAndroid && 'android.permission.RECORD_AUDIO',
    ].filter(Boolean));
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withCamera, pkg.name, pkg.version);
