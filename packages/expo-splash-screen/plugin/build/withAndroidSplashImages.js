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
const getAndroidSplashConfig_1 = require("./getAndroidSplashConfig");
const IMAGE_CACHE_NAME = 'splash-android';
const SPLASH_SCREEN_FILENAME = 'splashscreen_logo.png';
const SPLASH_SCREEN_DRAWABLE_NAME = 'splashscreen_logo.xml';
const DRAWABLES_CONFIGS = {
    default: {
        modes: {
            light: {
                path: `./res/drawable/${SPLASH_SCREEN_DRAWABLE_NAME}`,
            },
            dark: {
                path: `./res/drawable-night/${SPLASH_SCREEN_DRAWABLE_NAME}`,
            },
        },
        dimensionsMultiplier: 1,
    },
    mdpi: {
        modes: {
            light: {
                path: `./res/drawable-mdpi/${SPLASH_SCREEN_FILENAME}`,
            },
            dark: {
                path: `./res/drawable-night-mdpi/${SPLASH_SCREEN_FILENAME}`,
            },
        },
        dimensionsMultiplier: 1,
    },
    hdpi: {
        modes: {
            light: {
                path: `./res/drawable-hdpi/${SPLASH_SCREEN_FILENAME}`,
            },
            dark: {
                path: `./res/drawable-night-hdpi/${SPLASH_SCREEN_FILENAME}`,
            },
        },
        dimensionsMultiplier: 1.5,
    },
    xhdpi: {
        modes: {
            light: {
                path: `./res/drawable-xhdpi/${SPLASH_SCREEN_FILENAME}`,
            },
            dark: {
                path: `./res/drawable-night-xhdpi/${SPLASH_SCREEN_FILENAME}`,
            },
        },
        dimensionsMultiplier: 2,
    },
    xxhdpi: {
        modes: {
            light: {
                path: `./res/drawable-xxhdpi/${SPLASH_SCREEN_FILENAME}`,
            },
            dark: {
                path: `./res/drawable-night-xxhdpi/${SPLASH_SCREEN_FILENAME}`,
            },
        },
        dimensionsMultiplier: 3,
    },
    xxxhdpi: {
        modes: {
            light: {
                path: `./res/drawable-xxxhdpi/${SPLASH_SCREEN_FILENAME}`,
            },
            dark: {
                path: `./res/drawable-night-xxxhdpi/${SPLASH_SCREEN_FILENAME}`,
            },
        },
        dimensionsMultiplier: 4,
    },
};
const withAndroidSplashImages = (config, splash) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        async (config) => {
            if (splash) {
                await setSplashImageDrawablesAsync(splash, config.modRequest.projectRoot, splash?.imageWidth ?? 200);
            }
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
async function setSplashImageDrawablesAsync(props, projectRoot, imageWidth) {
    await clearAllExistingSplashImagesAsync(projectRoot);
    const splash = (0, getAndroidSplashConfig_1.getAndroidSplashConfig)(props);
    const darkSplash = (0, getAndroidSplashConfig_1.getAndroidDarkSplashConfig)(props);
    await Promise.all([
        setSplashImageDrawablesForThemeAsync(splash, 'light', projectRoot, imageWidth),
        setSplashImageDrawablesForThemeAsync(darkSplash, 'dark', projectRoot, imageWidth),
    ]);
}
async function clearAllExistingSplashImagesAsync(projectRoot) {
    const androidMainPath = path_1.default.join(projectRoot, 'android/app/src/main');
    await Promise.all(Object.values(DRAWABLES_CONFIGS).map(async ({ modes }) => {
        await Promise.all(Object.values(modes).map(async ({ path: filePath }) => {
            await fs_1.default.promises.rm(path_1.default.resolve(androidMainPath, filePath), {
                force: true,
                recursive: true,
            });
        }));
    }));
}
async function setSplashImageDrawablesForThemeAsync(config, theme, projectRoot, imageWidth = 100) {
    if (!config)
        return;
    const androidMainPath = path_1.default.join(projectRoot, 'android/app/src/main');
    if (config.drawable) {
        await writeSplashScreenDrawablesAsync(androidMainPath, projectRoot, config.drawable);
        return;
    }
    const sizes = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
    await Promise.all(sizes.map(async (imageKey) => {
        // @ts-ignore
        const image = config[imageKey];
        if (image) {
            const multiplier = DRAWABLES_CONFIGS[imageKey].dimensionsMultiplier;
            const size = imageWidth * multiplier; // "imageWidth" must be replaced by the logo width chosen by the user in its config file
            const canvasSize = 288 * multiplier;
            const background = await (0, image_utils_1.generateImageBackgroundAsync)({
                width: canvasSize,
                height: canvasSize,
                backgroundColor: config.backgroundColor ?? 'transparent',
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
            const outputPath = path_1.default.join(androidMainPath, DRAWABLES_CONFIGS[imageKey].modes[theme].path);
            const folder = path_1.default.dirname(outputPath);
            // Ensure directory exists.
            await fs_1.default.promises.mkdir(folder, { recursive: true });
            await fs_1.default.promises.writeFile(outputPath, composedImage);
        }
        return null;
    }));
}
async function writeSplashScreenDrawablesAsync(drawablePath, projectRoot, drawable) {
    if (!drawable) {
        return;
    }
    const lightDrawablePath = path_1.default.join(drawablePath, DRAWABLES_CONFIGS.default.modes.light.path);
    const darkDrawablePath = path_1.default.join(drawablePath, DRAWABLES_CONFIGS.default.modes.dark.path);
    const lightFolder = path_1.default.dirname(lightDrawablePath);
    await fs_1.default.promises.mkdir(lightFolder, { recursive: true });
    await fs_1.default.promises.copyFile(path_1.default.join(projectRoot, drawable.icon), lightDrawablePath);
    if (drawable.darkIcon) {
        const darkFolder = path_1.default.dirname(darkDrawablePath);
        await fs_1.default.promises.mkdir(darkFolder, { recursive: true });
        await fs_1.default.promises.copyFile(path_1.default.join(projectRoot, drawable.darkIcon), darkDrawablePath);
    }
}
