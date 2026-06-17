"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAssetsIos = void 0;
const image_utils_1 = require("@expo/image-utils");
const config_plugins_1 = require("expo/config-plugins");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const AssetContents_1 = require("./AssetContents");
const utils_1 = require("./utils");
const IMAGE_DIR = 'Images.xcassets';
const withAssetsIos = (config, assets) => {
    config = addAssetsToTarget(config, assets);
    return config;
};
exports.withAssetsIos = withAssetsIos;
function addAssetsToTarget(config, assets) {
    return (0, config_plugins_1.withXcodeProject)(config, async (config) => {
        const resolvedAssets = await (0, utils_1.resolveAssetPaths)(assets, config.modRequest.projectRoot);
        const validAssets = (0, utils_1.validateAssets)(resolvedAssets, 'ios');
        const project = config.modResults;
        const platformProjectRoot = config.modRequest.platformProjectRoot;
        config_plugins_1.IOSConfig.XcodeUtils.ensureGroupRecursively(project, 'Resources');
        const images = validAssets.filter((asset) => utils_1.IMAGE_TYPES.includes(path_1.default.extname(asset)));
        const assetsForResourcesDir = validAssets.filter((asset) => !utils_1.IMAGE_TYPES.includes(path_1.default.extname(asset)));
        await addImageAssets(images, config.modRequest.projectRoot);
        addResourceFiles(project, platformProjectRoot, assetsForResourcesDir);
        return config;
    });
}
function addResourceFiles(project, platformRoot, assets) {
    for (const asset of assets) {
        const assetPath = path_1.default.relative(platformRoot, asset);
        config_plugins_1.IOSConfig.XcodeUtils.addResourceFileToGroup({
            filepath: assetPath,
            groupName: 'Resources',
            project,
            isBuildFile: true,
            verbose: true,
        });
    }
}
async function addImageAssets(assets, root) {
    const iosNamedProjectRoot = config_plugins_1.IOSConfig.Paths.getSourceRoot(root);
    for (const asset of assets) {
        const name = path_1.default.basename(asset, path_1.default.extname(asset));
        const ext = path_1.default.extname(asset);
        const isGif = ext.toLowerCase() === '.gif';
        // As GIFs are not supported by iOS asset catalogs, convert to PNG; for others, use original extension
        const outputImage = isGif ? `${name}.png` : path_1.default.basename(asset);
        const assetPath = path_1.default.resolve(iosNamedProjectRoot, `${IMAGE_DIR}/${name}.imageset`);
        await promises_1.default.mkdir(assetPath, { recursive: true });
        if (isGif) {
            // GIFs need to be converted to PNG since iOS asset catalogs don't support animated GIFs
            // Use generateImageAsync to handle the conversion properly
            const buffer = await (0, image_utils_1.generateImageAsync)({ projectRoot: root }, {
                src: asset,
            });
            await promises_1.default.writeFile(path_1.default.resolve(assetPath, outputImage), buffer.source);
        }
        else {
            // For PNG and JPG, copy the file directly to preserve all original properties including transparency
            await promises_1.default.copyFile(asset, path_1.default.resolve(assetPath, outputImage));
        }
        await writeContentsJsonFileAsync({
            assetPath,
            image: outputImage,
        });
    }
}
async function writeContentsJsonFileAsync({ assetPath, image, }) {
    const images = buildContentsJsonImages({ image });
    await (0, AssetContents_1.writeContentsJsonAsync)(assetPath, { images });
}
function buildContentsJsonImages({ image }) {
    return [
        { idiom: 'universal', filename: image, scale: '1x' },
        { idiom: 'universal', scale: '2x' },
        { idiom: 'universal', scale: '3x' },
    ];
}
