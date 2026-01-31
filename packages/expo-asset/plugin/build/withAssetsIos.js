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
        const images = validAssets.filter((asset) => utils_1.IMAGE_TYPES.includes(path_1.default.extname(asset)));
        const assetsForResourcesDir = validAssets.filter((asset) => !utils_1.IMAGE_TYPES.includes(path_1.default.extname(asset)));
        await addImageAssets(images, config.modRequest.projectRoot);
        await addResourceFiles(project, platformProjectRoot, path_1.default.join(platformProjectRoot, config.modRequest.projectName), assetsForResourcesDir);
        return config;
    });
}
async function addResourceFiles(project, platformRoot, syncGroup, assets) {
    if (!config_plugins_1.IOSConfig.XcodeUtils.isAppTargetUsingFileSystemSynchronizedGroups(project)) {
        config_plugins_1.IOSConfig.XcodeUtils.ensureGroupRecursively(project, 'Resources');
        // TODO: Deprecate support for non-synchronized groups after SDK 55.
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
    else {
        // Copy assets to app group
        const assetsDirectory = path_1.default.join(syncGroup, 'assets');
        await promises_1.default.mkdir(assetsDirectory, { recursive: true });
        const projectRoot = path_1.default.join(platformRoot, '..');
        for (const asset of assets) {
            const relativeToProjectRoot = path_1.default.relative(projectRoot, asset);
            const destPath = path_1.default.join(assetsDirectory, relativeToProjectRoot);
            await promises_1.default.mkdir(path_1.default.dirname(destPath), { recursive: true });
            await promises_1.default.copyFile(asset, destPath);
        }
    }
}
async function addImageAssets(assets, root) {
    const iosNamedProjectRoot = config_plugins_1.IOSConfig.Paths.getSourceRoot(root);
    for (const asset of assets) {
        const name = path_1.default.basename(asset, path_1.default.extname(asset));
        const image = path_1.default.basename(asset);
        const assetPath = path_1.default.resolve(iosNamedProjectRoot, `${IMAGE_DIR}/${name}.imageset`);
        await promises_1.default.mkdir(assetPath, { recursive: true });
        const buffer = await (0, image_utils_1.generateImageAsync)({ projectRoot: root }, {
            src: asset,
        });
        await promises_1.default.writeFile(path_1.default.resolve(assetPath, image), buffer.source);
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
        { idiom: 'universal', filename: image, scale: '1x' },
        { idiom: 'universal', scale: '2x' },
        { idiom: 'universal', scale: '3x' },
    ];
}
