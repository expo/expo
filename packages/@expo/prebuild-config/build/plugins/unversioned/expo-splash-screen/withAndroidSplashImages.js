"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSplashImageDrawablesForThemeAsync = exports.setSplashImageDrawablesAsync = exports.withAndroidSplashImages = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const image_utils_1 = require("@expo/image-utils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const getAndroidSplashConfig_1 = require("./getAndroidSplashConfig");
const IMAGE_CACHE_NAME = 'splash-android';
const SPLASH_SCREEN_FILENAME = 'splashscreen_image.png';
const DRAWABLES_CONFIGS = {
    default: {
        modes: {
            light: {
                path: `./res/drawable/${SPLASH_SCREEN_FILENAME}`,
            },
            dark: {
                path: `./res/drawable-night/${SPLASH_SCREEN_FILENAME}`,
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
const withAndroidSplashImages = (config) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        async (config) => {
            await setSplashImageDrawablesAsync(config, config.modRequest.projectRoot);
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
async function setSplashImageDrawablesAsync(config, projectRoot) {
    await clearAllExistingSplashImagesAsync(projectRoot);
    const splash = (0, getAndroidSplashConfig_1.getAndroidSplashConfig)(config);
    const darkSplash = (0, getAndroidSplashConfig_1.getAndroidDarkSplashConfig)(config);
    await Promise.all([
        setSplashImageDrawablesForThemeAsync(splash, 'light', projectRoot),
        setSplashImageDrawablesForThemeAsync(darkSplash, 'dark', projectRoot),
    ]);
}
exports.setSplashImageDrawablesAsync = setSplashImageDrawablesAsync;
async function clearAllExistingSplashImagesAsync(projectRoot) {
    const androidMainPath = path_1.default.join(projectRoot, 'android/app/src/main');
    await Promise.all(Object.values(DRAWABLES_CONFIGS).map(async ({ modes }) => {
        await Promise.all(Object.values(modes).map(async ({ path: filePath }) => {
            if (await fs_extra_1.default.pathExists(path_1.default.resolve(androidMainPath, filePath))) {
                await fs_extra_1.default.remove(path_1.default.resolve(androidMainPath, filePath));
            }
        }));
    }));
}
async function setSplashImageDrawablesForThemeAsync(config, theme, projectRoot) {
    if (!config)
        return;
    const androidMainPath = path_1.default.join(projectRoot, 'android/app/src/main');
    await Promise.all(['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'].map(async (imageKey) => {
        // @ts-ignore
        const image = config[imageKey];
        if (image) {
            // Using this method will cache the images in `.expo` based on the properties used to generate them.
            // this method also supports remote URLs and using the global sharp instance.
            const { source } = await (0, image_utils_1.generateImageAsync)({ projectRoot, cacheType: IMAGE_CACHE_NAME }, {
                src: image,
            });
            // Get output path for drawable.
            const outputPath = path_1.default.join(androidMainPath, 
            // @ts-ignore
            DRAWABLES_CONFIGS[imageKey].modes[theme].path);
            // Ensure directory exists.
            const folder = path_1.default.dirname(outputPath);
            await fs_extra_1.default.ensureDir(folder);
            // Write image buffer to the file system.
            await fs_extra_1.default.writeFile(outputPath, source);
        }
        return null;
    }));
}
exports.setSplashImageDrawablesForThemeAsync = setSplashImageDrawablesForThemeAsync;
