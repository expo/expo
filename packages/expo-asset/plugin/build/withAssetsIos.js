"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAssetsIos = void 0;
const image_utils_1 = require("@expo/image-utils");
const AssetContents_1 = require("@expo/prebuild-config/build/plugins/icons/AssetContents");
const config_plugins_1 = require("expo/config-plugins");
const fs_extra_1 = require("fs-extra");
const path_1 = __importDefault(require("path"));
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
        const validAssets = (0, utils_1.validateAssets)(resolvedAssets);
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
        const image = path_1.default.basename(asset);
        const assetPath = path_1.default.resolve(iosNamedProjectRoot, `${IMAGE_DIR}/${name}.imageset`);
        await (0, fs_extra_1.ensureDir)(assetPath);
        const buffer = await (0, image_utils_1.generateImageAsync)({ projectRoot: root }, {
            src: asset,
        });
        await (0, fs_extra_1.writeFile)(path_1.default.resolve(assetPath, image), buffer.source);
        await writeContentsJsonFileAsync({
            assetPath,
            image,
        });
    }
}
async function writeContentsJsonFileAsync({ assetPath, image, }) {
    const images = buildContentsJsonImages({ image });
    await (0, AssetContents_1.writeContentsJsonAsync)(assetPath, { images });
}
function buildContentsJsonImages({ image }) {
    return [
        (0, AssetContents_1.createContentsJsonItem)({
            idiom: 'universal',
            filename: image,
            scale: '1x',
        }),
        (0, AssetContents_1.createContentsJsonItem)({
            idiom: 'universal',
            scale: '2x',
        }),
        (0, AssetContents_1.createContentsJsonItem)({
            idiom: 'universal',
            scale: '3x',
        }),
    ];
}
