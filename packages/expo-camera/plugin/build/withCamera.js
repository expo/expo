"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCameraImport = void 0;
const config_plugins_1 = require("expo/config-plugins");
const appendCode_1 = require("./appendCode");
const pkg = require('expo-camera/package.json');
const CAMERA_USAGE = 'Allow $(PRODUCT_NAME) to access your camera';
const MICROPHONE_USAGE = 'Allow $(PRODUCT_NAME) to access your microphone';
// Because we need the package to be added AFTER the React and Google maven packages, we create a new allprojects.
// It's ok to have multiple allprojects.repositories, so we create a new one since it's cheaper than tokenizing
// the existing block to find the correct place to insert our camera maven.
const gradleMaven = [
    `def expoCameraMavenPath = new File(["node", "--print", "require.resolve('expo-camera/package.json')"].execute(null, rootDir).text.trim(), "../android/maven")`,
    `allprojects { repositories { maven { url(expoCameraMavenPath) } } }`,
].join('\n');
const withAndroidCameraGradle = (config) => {
    return (0, config_plugins_1.withProjectBuildGradle)(config, (config) => {
        if (config.modResults.language === 'groovy') {
            config.modResults.contents = addCameraImport(config.modResults.contents).contents;
        }
        else {
            throw new Error('Cannot add camera maven gradle because the build.gradle is not groovy');
        }
        return config;
    });
};
/** @internal Exposed for testing */
function addCameraImport(src) {
    return (0, appendCode_1.appendGeneratedCodeContents)({
        tag: 'expo-camera-import',
        src,
        generatedCode: gradleMaven,
        comment: '//',
    });
}
exports.addCameraImport = addCameraImport;
const withCamera = (config, { cameraPermission, microphonePermission, recordAudioAndroid = true } = {}) => {
    config_plugins_1.IOSConfig.Permissions.createPermissionsPlugin({
        NSCameraUsageDescription: CAMERA_USAGE,
        NSMicrophoneUsageDescription: MICROPHONE_USAGE,
    })(config, {
        NSCameraUsageDescription: cameraPermission,
        NSMicrophoneUsageDescription: microphonePermission,
    });
    config = config_plugins_1.AndroidConfig.Permissions.withPermissions(config, [
        'android.permission.CAMERA',
        // Optional
        recordAudioAndroid && 'android.permission.RECORD_AUDIO',
    ].filter(Boolean));
    return withAndroidCameraGradle(config);
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withCamera, pkg.name, pkg.version);
