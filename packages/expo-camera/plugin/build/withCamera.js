"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCameraImport = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const generateCode_1 = require("@expo/config-plugins/build/utils/generateCode");
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
function addCameraImport(src) {
    return appendContents({
        tag: 'expo-camera-import',
        src,
        newSrc: gradleMaven,
        comment: '//',
    });
}
exports.addCameraImport = addCameraImport;
// Fork of config-plugins mergeContents, but appends the contents to the end of the file.
function appendContents({ src, newSrc, tag, comment, }) {
    const header = (0, generateCode_1.createGeneratedHeaderComment)(newSrc, tag, comment);
    if (!src.includes(header)) {
        // Ensure the old generated contents are removed.
        const sanitizedTarget = (0, generateCode_1.removeGeneratedContents)(src, tag);
        const contentsToAdd = [
            // @something
            header,
            // contents
            newSrc,
            // @end
            `${comment} @generated end ${tag}`,
        ].join('\n');
        return {
            contents: sanitizedTarget ?? src + contentsToAdd,
            didMerge: true,
            didClear: !!sanitizedTarget,
        };
    }
    return { contents: src, didClear: false, didMerge: false };
}
const withCamera = (config, { cameraPermission, microphonePermission } = {}) => {
    config = (0, config_plugins_1.withInfoPlist)(config, (config) => {
        config.modResults.NSCameraUsageDescription =
            cameraPermission || config.modResults.NSCameraUsageDescription || CAMERA_USAGE;
        config.modResults.NSMicrophoneUsageDescription =
            microphonePermission || config.modResults.NSMicrophoneUsageDescription || MICROPHONE_USAGE;
        return config;
    });
    config = config_plugins_1.AndroidConfig.Permissions.withPermissions(config, [
        'android.permission.CAMERA',
        // Optional
        'android.permission.RECORD_AUDIO',
    ]);
    return withAndroidCameraGradle(config);
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withCamera, pkg.name, pkg.version);
