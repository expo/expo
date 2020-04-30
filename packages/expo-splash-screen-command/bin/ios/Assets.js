"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const SPLASH_SCREEN_FILENAME = 'splashscreen.png';
const FILES_PATHS = {
    IMAGESET: 'Images.xcassets/SplashScreen.imageset',
    IMAGESET_CONTENTS: 'Images.xcassets/SplashScreen.imageset/Contents.json',
    PNG: `Images.xcassets/SplashScreen.imageset/${SPLASH_SCREEN_FILENAME}`,
};
/**
 * Creates [IMAGESET] containing image for Splash/Launch Screen.
 */
async function configureAssets(iosProjectPath, imagePath) {
    const imageSetPath = path_1.default.resolve(iosProjectPath, FILES_PATHS.IMAGESET);
    // ensure old SplashScreen imageSet is removed
    if (await fs_extra_1.default.pathExists(imageSetPath)) {
        await fs_extra_1.default.remove(imageSetPath);
    }
    if (imagePath) {
        await fs_extra_1.default.mkdirp(imageSetPath);
        const contentJson = {
            images: [
                {
                    idiom: 'universal',
                    filename: SPLASH_SCREEN_FILENAME,
                    scale: '1x',
                },
                {
                    idiom: 'universal',
                    scale: '2x',
                },
                {
                    idiom: 'universal',
                    scale: '3x',
                },
            ],
            info: {
                version: 1,
                author: 'xcode',
            },
        };
        await fs_extra_1.default.writeFile(path_1.default.resolve(iosProjectPath, FILES_PATHS.IMAGESET_CONTENTS), JSON.stringify(contentJson, null, 2));
        await fs_extra_1.default.copyFile(imagePath, path_1.default.resolve(iosProjectPath, FILES_PATHS.PNG));
    }
}
exports.default = configureAssets;
//# sourceMappingURL=Assets.js.map