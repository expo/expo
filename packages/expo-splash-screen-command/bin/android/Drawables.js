"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const SPLASH_SCREEN_FILENAME = 'splashscreen_image.png';
const DRAWABLES_CONFIGS = {
    default: {
        path: `./res/drawable/${SPLASH_SCREEN_FILENAME}`,
        dimensionsMultiplier: 1,
    },
    mdpi: {
        path: `./res/drawable-mdpi/${SPLASH_SCREEN_FILENAME}`,
        dimensionsMultiplier: 1,
    },
    hdpi: {
        path: `./res/drawable-hdpi/${SPLASH_SCREEN_FILENAME}`,
        dimensionsMultiplier: 1.5,
    },
    xhdpi: {
        path: `./res/drawable-xhdpi/${SPLASH_SCREEN_FILENAME}`,
        dimensionsMultiplier: 2,
    },
    xxhdpi: {
        path: `./res/drawable-xxhdpi/${SPLASH_SCREEN_FILENAME}`,
        dimensionsMultiplier: 3,
    },
    xxxhdpi: {
        path: `./res/drawable-xxxhdpi/${SPLASH_SCREEN_FILENAME}`,
        dimensionsMultiplier: 4,
    },
};
const DRAWABLE_DIR_PATH = './res/drawable';
const SPLASH_SCREEN_DRAWABLE_PATH = `./res/drawable/${SPLASH_SCREEN_FILENAME}`;
/**
 * Deletes all previous splash_screen_images and copies new one to desired drawable directory.
 * If path isn't provided then no new image is placed in drawable directories.
 * @see https://developer.android.com/training/multiscreen/screendensities
 */
async function configureDrawables(androidMainPath, splashScreenImagePath) {
    await Promise.all(Object.values(DRAWABLES_CONFIGS).map(async ({ path: drawbalePath }) => {
        if (await fs_extra_1.default.pathExists(path_1.default.resolve(androidMainPath, drawbalePath))) {
            await fs_extra_1.default.remove(path_1.default.resolve(androidMainPath, drawbalePath));
        }
    }));
    if (splashScreenImagePath) {
        if (!(await fs_extra_1.default.pathExists(path_1.default.resolve(androidMainPath, DRAWABLE_DIR_PATH)))) {
            await fs_extra_1.default.mkdir(path_1.default.resolve(androidMainPath, DRAWABLE_DIR_PATH));
        }
        await fs_extra_1.default.copyFile(splashScreenImagePath, path_1.default.resolve(androidMainPath, SPLASH_SCREEN_DRAWABLE_PATH));
    }
}
exports.default = configureDrawables;
//# sourceMappingURL=Drawables.js.map