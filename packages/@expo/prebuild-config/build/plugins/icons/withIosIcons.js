"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniversalIconAsync = exports.setIconsAsync = exports.getIcons = exports.withIosIcons = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const image_utils_1 = require("@expo/image-utils");
const fs = __importStar(require("fs-extra"));
const path_1 = require("path");
const AssetContents_1 = require("./AssetContents");
const { getProjectName } = config_plugins_1.IOSConfig.XcodeUtils;
const IMAGE_CACHE_NAME = 'icons';
const IMAGESET_PATH = 'Images.xcassets/AppIcon.appiconset';
const withIosIcons = (config) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'ios',
        async (config) => {
            await setIconsAsync(config, config.modRequest.projectRoot);
            return config;
        },
    ]);
};
exports.withIosIcons = withIosIcons;
function getIcons(config) {
    // No support for empty strings.
    return config.ios?.icon || config.icon || null;
}
exports.getIcons = getIcons;
async function setIconsAsync(config, projectRoot) {
    const icon = getIcons(config);
    if (!icon) {
        config_plugins_1.WarningAggregator.addWarningIOS('icon', 'This is the image that your app uses on your home screen, you will need to configure it manually.');
        return;
    }
    // Something like projectRoot/ios/MyApp/
    const iosNamedProjectRoot = getIosNamedProjectPath(projectRoot);
    // Ensure the Images.xcassets/AppIcon.appiconset path exists
    await fs.ensureDir((0, path_1.join)(iosNamedProjectRoot, IMAGESET_PATH));
    // Store the image JSON data for assigning via the Contents.json
    const imagesJson = await generateUniversalIconAsync(projectRoot, {
        icon,
        cacheKey: 'universal-icon',
        iosNamedProjectRoot,
        platform: 'ios',
    });
    // Finally, write the Config.json
    await (0, AssetContents_1.writeContentsJsonAsync)((0, path_1.join)(iosNamedProjectRoot, IMAGESET_PATH), { images: imagesJson });
}
exports.setIconsAsync = setIconsAsync;
/**
 * Return the project's named iOS path: ios/MyProject/
 *
 * @param projectRoot Expo project root path.
 */
function getIosNamedProjectPath(projectRoot) {
    const projectName = getProjectName(projectRoot);
    return (0, path_1.join)(projectRoot, 'ios', projectName);
}
function getAppleIconName(size, scale) {
    return `App-Icon-${size}x${size}@${scale}x.png`;
}
async function generateUniversalIconAsync(projectRoot, { icon, cacheKey, iosNamedProjectRoot, platform, }) {
    const size = 1024;
    const filename = getAppleIconName(size, 1);
    // Using this method will cache the images in `.expo` based on the properties used to generate them.
    // this method also supports remote URLs and using the global sharp instance.
    const { source } = await (0, image_utils_1.generateImageAsync)({ projectRoot, cacheType: IMAGE_CACHE_NAME + cacheKey }, {
        src: icon,
        name: filename,
        width: size,
        height: size,
        removeTransparency: true,
        // The icon should be square, but if it's not then it will be cropped.
        resizeMode: 'cover',
        // Force the background color to solid white to prevent any transparency.
        // TODO: Maybe use a more adaptive option based on the icon color?
        backgroundColor: '#ffffff',
    });
    // Write image buffer to the file system.
    const assetPath = (0, path_1.join)(iosNamedProjectRoot, IMAGESET_PATH, filename);
    await fs.writeFile(assetPath, source);
    return [
        {
            filename: getAppleIconName(size, 1),
            idiom: 'universal',
            platform,
            size: `${size}x${size}`,
        },
    ];
}
exports.generateUniversalIconAsync = generateUniversalIconAsync;
