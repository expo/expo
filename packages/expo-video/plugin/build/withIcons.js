"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "withIcons", {
    enumerable: true,
    get: function() {
        return withIcons;
    }
});
function _imageutils() {
    const data = require("@expo/image-utils");
    _imageutils = function() {
        return data;
    };
    return data;
}
function _configplugins() {
    const data = require("expo/config-plugins");
    _configplugins = function() {
        return data;
    };
    return data;
}
function _fs() {
    const data = require("fs");
    _fs = function() {
        return data;
    };
    return data;
}
function _path() {
    const data = require("path");
    _path = function() {
        return data;
    };
    return data;
}
const BASELINE_PIXEL_SIZE = 96;
const ERROR_MSG_PREFIX = 'An error occurred while configuring Android expo-video icons.';
const ANDROID_DRAWABLE_PATH = 'android/app/src/main/res/drawable/';
const EXPO_VIDEO_ICON_PREFIX = 'expo_video_icon_';
async function writeIconAsync(icon, projectRoot) {
    const drawableFolderPath = (0, _path().resolve)(projectRoot, ANDROID_DRAWABLE_PATH);
    if (!(0, _fs().existsSync)(drawableFolderPath)) {
        (0, _fs().mkdirSync)(drawableFolderPath, {
            recursive: true
        });
    }
    try {
        const resizedIcon = (await (0, _imageutils().generateImageAsync)({
            projectRoot,
            cacheType: 'expo-video-android-icon'
        }, {
            src: icon,
            width: BASELINE_PIXEL_SIZE,
            height: BASELINE_PIXEL_SIZE,
            resizeMode: 'cover',
            backgroundColor: 'transparent'
        })).source;
        const originalIconName = (0, _path().basename)(icon);
        const iconFilename = `${EXPO_VIDEO_ICON_PREFIX}${originalIconName}`;
        (0, _fs().writeFileSync)((0, _path().resolve)(drawableFolderPath, iconFilename), resizedIcon);
    } catch (e) {
        throw new Error(ERROR_MSG_PREFIX + 'Encountered an issue resizing icon: ' + e);
    }
}
async function removeIconImageFiles(projectRoot) {
    const drawableFolderPath = (0, _path().resolve)(projectRoot, ANDROID_DRAWABLE_PATH);
    if (!(0, _fs().existsSync)(drawableFolderPath)) {
        return;
    }
    (0, _fs().readdirSync)(drawableFolderPath).forEach((file)=>{
        if (file.startsWith(EXPO_VIDEO_ICON_PREFIX)) {
            (0, _fs().unlinkSync)((0, _path().resolve)(drawableFolderPath, file));
        }
    });
}
const withIcons = (config, { icons = [] })=>{
    return (0, _configplugins().withDangerousMod)(config, [
        'android',
        async (config)=>{
            if (icons.length) {
                await Promise.all(icons.map((icon)=>writeIconAsync(icon, config.modRequest.projectRoot)));
            } else {
                await removeIconImageFiles(config.modRequest.projectRoot);
            }
            return config;
        }
    ]);
};

//# sourceMappingURL=withIcons.js.map
