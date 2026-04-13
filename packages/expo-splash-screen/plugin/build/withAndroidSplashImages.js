"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAndroidSplashImages = void 0;
exports.setSplashImageDrawablesAsync = setSplashImageDrawablesAsync;
exports.setSplashImageDrawablesForThemeAsync = setSplashImageDrawablesForThemeAsync;
const image_utils_1 = require("@expo/image-utils");
const config_plugins_1 = require("expo/config-plugins");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const IMAGE_CACHE_NAME = 'splash-android';
const SPLASH_SCREEN_FILENAME = 'splashscreen_logo.png';
const SPLASH_SCREEN_DRAWABLE_NAME = 'splashscreen_logo.xml';
const DRAWABLES_CONFIGS = {
    default: {
        lightPath: `./res/drawable/${SPLASH_SCREEN_DRAWABLE_NAME}`,
        darkPath: `./res/drawable-night/${SPLASH_SCREEN_DRAWABLE_NAME}`,
        multiplier: 1,
    },
    mdpi: {
        lightPath: `./res/drawable-mdpi/${SPLASH_SCREEN_FILENAME}`,
        darkPath: `./res/drawable-night-mdpi/${SPLASH_SCREEN_FILENAME}`,
        multiplier: 1,
    },
    hdpi: {
        lightPath: `./res/drawable-hdpi/${SPLASH_SCREEN_FILENAME}`,
        darkPath: `./res/drawable-night-hdpi/${SPLASH_SCREEN_FILENAME}`,
        multiplier: 1.5,
    },
    xhdpi: {
        lightPath: `./res/drawable-xhdpi/${SPLASH_SCREEN_FILENAME}`,
        darkPath: `./res/drawable-night-xhdpi/${SPLASH_SCREEN_FILENAME}`,
        multiplier: 2,
    },
    xxhdpi: {
        lightPath: `./res/drawable-xxhdpi/${SPLASH_SCREEN_FILENAME}`,
        darkPath: `./res/drawable-night-xxhdpi/${SPLASH_SCREEN_FILENAME}`,
        multiplier: 3,
    },
    xxxhdpi: {
        lightPath: `./res/drawable-xxxhdpi/${SPLASH_SCREEN_FILENAME}`,
        darkPath: `./res/drawable-night-xxxhdpi/${SPLASH_SCREEN_FILENAME}`,
        multiplier: 4,
    },
};
const withAndroidSplashImages = (config, splash) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        async (config) => {
            await setSplashImageDrawablesAsync(splash, config.modRequest.projectRoot);
            return config;
        },
    ]);
};
exports.withAndroidSplashImages = withAndroidSplashImages;
/**
 * Deletes all previous splash_screen_images and copies new one to desired drawable directory.
 * If path isn't provided then no new image is placed in drawable directories.
 * @see https://developer.android.com/training/multiscreen/screendensities
 *
 * @param androidMainPath Absolute path to the main directory containing code and resources in Android project. In general that would be `android/app/src/main`.
 */
async function setSplashImageDrawablesAsync({ dark, drawable, ...root }, projectRoot) {
    await clearAllExistingSplashImagesAsync(projectRoot);
    if (drawable != null) {
        await writeSplashScreenDrawablesAsync(projectRoot, drawable);
    }
    else {
        await Promise.all([
            setSplashImageDrawablesForThemeAsync(root, 'light', projectRoot, root.imageWidth),
            setSplashImageDrawablesForThemeAsync(dark, 'dark', projectRoot, root.imageWidth),
        ]);
    }
}
async function clearAllExistingSplashImagesAsync(projectRoot) {
    const androidMainPath = path_1.default.join(projectRoot, 'android/app/src/main');
    const paths = Object.values(DRAWABLES_CONFIGS)
        .map(({ lightPath, darkPath }) => [lightPath, darkPath])
        .flat();
    await Promise.all(paths.map((filePath) => {
        return fs_1.default.promises.rm(path_1.default.resolve(androidMainPath, filePath), {
            force: true,
            recursive: true,
        });
    }));
}
async function setSplashImageDrawablesForThemeAsync(config, theme, projectRoot, imageWidth) {
    if (!config) {
        return;
    }
    const androidMainPath = path_1.default.join(projectRoot, 'android/app/src/main');
    const sizes = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
    await Promise.all(sizes.map(async (sizeKey) => {
        const image = config[sizeKey];
        if (image) {
            const drawableConfig = DRAWABLES_CONFIGS[sizeKey];
            const { multiplier } = drawableConfig;
            const size = imageWidth * multiplier; // "imageWidth" must be replaced by the logo width chosen by the user in its config file
            const canvasSize = 288 * multiplier;
            const background = await (0, image_utils_1.generateImageBackgroundAsync)({
                width: canvasSize,
                height: canvasSize,
                backgroundColor: 'transparent',
                resizeMode: 'cover',
            });
            const { source: foreground } = await (0, image_utils_1.generateImageAsync)({
                projectRoot,
                cacheType: IMAGE_CACHE_NAME,
            }, {
                src: image,
                resizeMode: 'contain',
                width: size,
                height: size,
            });
            const composedImage = await (0, image_utils_1.compositeImagesAsync)({
                background,
                foreground,
                x: (canvasSize - size) / 2,
                y: (canvasSize - size) / 2,
            });
            // Get output path for drawable.
            const outputPath = path_1.default.join(androidMainPath, theme === 'light' ? drawableConfig.lightPath : drawableConfig.darkPath);
            const folder = path_1.default.dirname(outputPath);
            // Ensure directory exists.
            await fs_1.default.promises.mkdir(folder, { recursive: true });
            await fs_1.default.promises.writeFile(outputPath, composedImage);
        }
    }));
}
async function writeSplashScreenDrawablesAsync(projectRoot, drawable) {
    const androidMainPath = path_1.default.join(projectRoot, 'android/app/src/main');
    const lightDrawablePath = path_1.default.join(androidMainPath, DRAWABLES_CONFIGS.default.lightPath);
    const darkDrawablePath = path_1.default.join(androidMainPath, DRAWABLES_CONFIGS.default.darkPath);
    const lightFolder = path_1.default.dirname(lightDrawablePath);
    await fs_1.default.promises.mkdir(lightFolder, { recursive: true });
    await fs_1.default.promises.copyFile(path_1.default.join(projectRoot, drawable.icon), lightDrawablePath);
    if (drawable.darkIcon) {
        const darkFolder = path_1.default.dirname(darkDrawablePath);
        await fs_1.default.promises.mkdir(darkFolder, { recursive: true });
        await fs_1.default.promises.copyFile(path_1.default.join(projectRoot, drawable.darkIcon), darkDrawablePath);
    }
}
