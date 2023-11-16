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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildContentsJsonImages = exports.withIosSplashAssets = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const image_utils_1 = require("@expo/image-utils");
const debug_1 = __importDefault(require("debug"));
const fs_extra_1 = __importDefault(require("fs-extra"));
// @ts-ignore
const jimp_compact_1 = __importDefault(require("jimp-compact"));
const path = __importStar(require("path"));
const AssetContents_1 = require("../../icons/AssetContents");
const debug = (0, debug_1.default)('expo:prebuild-config:expo-splash-screen:ios:assets');
const IMAGE_CACHE_NAME = 'splash-ios';
const IMAGESET_PATH = 'Images.xcassets/SplashScreen.imageset';
const BACKGROUND_IMAGESET_PATH = 'Images.xcassets/SplashScreenBackground.imageset';
const PNG_FILENAME = 'image.png';
const DARK_PNG_FILENAME = 'dark_image.png';
const TABLET_PNG_FILENAME = 'tablet_image.png';
const DARK_TABLET_PNG_FILENAME = 'dark_tablet_image.png';
const withIosSplashAssets = (config, splash) => {
    if (!splash) {
        return config;
    }
    return (0, config_plugins_1.withDangerousMod)(config, [
        'ios',
        async (config) => {
            const iosNamedProjectRoot = config_plugins_1.IOSConfig.Paths.getSourceRoot(config.modRequest.projectRoot);
            await createSplashScreenBackgroundImageAsync({
                iosNamedProjectRoot,
                splash,
            });
            await configureImageAssets({
                projectRoot: config.modRequest.projectRoot,
                iosNamedProjectRoot,
                image: splash.image,
                darkImage: splash.dark?.image,
                tabletImage: splash.tabletImage,
                darkTabletImage: splash.dark?.tabletImage,
            });
            return config;
        },
    ]);
};
exports.withIosSplashAssets = withIosSplashAssets;
/**
 * Creates imageset containing image for Splash/Launch Screen.
 */
async function configureImageAssets({ projectRoot, iosNamedProjectRoot, image, darkImage, tabletImage, darkTabletImage, }) {
    const imageSetPath = path.resolve(iosNamedProjectRoot, IMAGESET_PATH);
    // ensure old SplashScreen imageSet is removed
    await fs_extra_1.default.remove(imageSetPath);
    if (!image) {
        return;
    }
    await writeContentsJsonFileAsync({
        assetPath: imageSetPath,
        image: PNG_FILENAME,
        darkImage: darkImage ? DARK_PNG_FILENAME : null,
        tabletImage: tabletImage ? TABLET_PNG_FILENAME : null,
        darkTabletImage: darkTabletImage ? DARK_TABLET_PNG_FILENAME : null,
    });
    await copyImageFiles({
        projectRoot,
        iosNamedProjectRoot,
        image,
        darkImage,
        tabletImage,
        darkTabletImage,
    });
}
async function createPngFileAsync(color, filePath) {
    const png = new jimp_compact_1.default(1, 1, color);
    return png.writeAsync(filePath);
}
async function createBackgroundImagesAsync({ iosNamedProjectRoot, color, darkColor, tabletColor, darkTabletColor, }) {
    await generateImagesAssetsAsync({
        async generateImageAsset(item, fileName) {
            await createPngFileAsync(item, path.resolve(iosNamedProjectRoot, BACKGROUND_IMAGESET_PATH, fileName));
        },
        anyItem: color,
        darkItem: darkColor,
        tabletItem: tabletColor,
        darkTabletItem: darkTabletColor,
    });
}
async function copyImageFiles({ projectRoot, iosNamedProjectRoot, image, darkImage, tabletImage, darkTabletImage, }) {
    await generateImagesAssetsAsync({
        async generateImageAsset(item, fileName) {
            // Using this method will cache the images in `.expo` based on the properties used to generate them.
            // this method also supports remote URLs and using the global sharp instance.
            const { source } = await (0, image_utils_1.generateImageAsync)({ projectRoot, cacheType: IMAGE_CACHE_NAME }, {
                src: item,
            });
            // Write image buffer to the file system.
            // const assetPath = join(iosNamedProjectRoot, IMAGESET_PATH, filename);
            await fs_extra_1.default.writeFile(path.resolve(iosNamedProjectRoot, IMAGESET_PATH, fileName), source);
        },
        anyItem: image,
        darkItem: darkImage,
        tabletItem: tabletImage,
        darkTabletItem: darkTabletImage,
    });
}
async function generateImagesAssetsAsync({ generateImageAsset, anyItem, darkItem, tabletItem, darkTabletItem, }) {
    const items = [
        [anyItem, PNG_FILENAME],
        [darkItem, DARK_PNG_FILENAME],
        [tabletItem, TABLET_PNG_FILENAME],
        [darkTabletItem, DARK_TABLET_PNG_FILENAME],
    ].filter(([item]) => !!item);
    await Promise.all(items.map(([item, fileName]) => generateImageAsset(item, fileName)));
}
async function createSplashScreenBackgroundImageAsync({ iosNamedProjectRoot, splash, }) {
    const color = splash.backgroundColor;
    const darkColor = splash.dark?.backgroundColor;
    const tabletColor = splash.tabletBackgroundColor;
    const darkTabletColor = splash.dark?.tabletBackgroundColor;
    const imagesetPath = path.join(iosNamedProjectRoot, BACKGROUND_IMAGESET_PATH);
    // Ensure the Images.xcassets/... path exists
    await fs_extra_1.default.remove(imagesetPath);
    await fs_extra_1.default.ensureDir(imagesetPath);
    await createBackgroundImagesAsync({
        iosNamedProjectRoot,
        color,
        darkColor: darkColor ? darkColor : null,
        tabletColor: tabletColor ? tabletColor : null,
        darkTabletColor: darkTabletColor ? darkTabletColor : null,
    });
    await writeContentsJsonFileAsync({
        assetPath: path.resolve(iosNamedProjectRoot, BACKGROUND_IMAGESET_PATH),
        image: PNG_FILENAME,
        darkImage: darkColor ? DARK_PNG_FILENAME : null,
        tabletImage: tabletColor ? TABLET_PNG_FILENAME : null,
        darkTabletImage: darkTabletColor ? DARK_TABLET_PNG_FILENAME : null,
    });
}
const darkAppearances = [
    {
        appearance: 'luminosity',
        value: 'dark',
    },
];
function buildContentsJsonImages({ image, darkImage, tabletImage, darkTabletImage, }) {
    return [
        // Phone light
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
        // Phone dark
        darkImage &&
            (0, AssetContents_1.createContentsJsonItem)({
                idiom: 'universal',
                appearances: darkAppearances,
                filename: darkImage,
                scale: '1x',
            }),
        darkImage &&
            (0, AssetContents_1.createContentsJsonItem)({
                idiom: 'universal',
                appearances: darkAppearances,
                scale: '2x',
            }),
        darkImage &&
            (0, AssetContents_1.createContentsJsonItem)({
                idiom: 'universal',
                appearances: darkAppearances,
                scale: '3x',
            }),
        // Tablet light
        tabletImage &&
            (0, AssetContents_1.createContentsJsonItem)({
                idiom: 'ipad',
                filename: tabletImage,
                scale: '1x',
            }),
        tabletImage &&
            (0, AssetContents_1.createContentsJsonItem)({
                idiom: 'ipad',
                scale: '2x',
            }),
        // Phone dark
        darkTabletImage &&
            (0, AssetContents_1.createContentsJsonItem)({
                idiom: 'ipad',
                appearances: darkAppearances,
                filename: darkTabletImage ?? undefined,
                scale: '1x',
            }),
        darkTabletImage &&
            (0, AssetContents_1.createContentsJsonItem)({
                idiom: 'ipad',
                appearances: darkAppearances,
                scale: '2x',
            }),
    ].filter(Boolean);
}
exports.buildContentsJsonImages = buildContentsJsonImages;
async function writeContentsJsonFileAsync({ assetPath, image, darkImage, tabletImage, darkTabletImage, }) {
    const images = buildContentsJsonImages({ image, darkImage, tabletImage, darkTabletImage });
    debug(`create contents.json:`, assetPath);
    debug(`use images:`, images);
    await (0, AssetContents_1.writeContentsJsonAsync)(assetPath, { images });
}
