"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withIosSplashColors = exports.SPLASHSCREEN_COLORSET_PATH = void 0;
const debug_1 = __importDefault(require("debug"));
const config_plugins_1 = require("expo/config-plugins");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const InterfaceBuilder_1 = require("./InterfaceBuilder");
const debug = (0, debug_1.default)('expo:expo-splash-screen:ios:splash-colorset');
exports.SPLASHSCREEN_COLORSET_PATH = 'Images.xcassets/SplashScreenBackground.colorset';
const darkAppearances = [{ appearance: 'luminosity', value: 'dark' }];
const withIosSplashColors = (config, splash) => {
    if (!splash) {
        return config;
    }
    return (0, config_plugins_1.withDangerousMod)(config, [
        'ios',
        async (config) => {
            const iosNamedProjectRoot = config_plugins_1.IOSConfig.Paths.getSourceRoot(config.modRequest.projectRoot);
            await configureColorAssets({
                iosNamedProjectRoot,
                backgroundColor: splash.backgroundColor,
                darkBackgroundColor: splash.dark?.backgroundColor,
            });
            return config;
        },
    ]);
};
exports.withIosSplashColors = withIosSplashColors;
async function configureColorAssets({ iosNamedProjectRoot, backgroundColor = '#ffffff', darkBackgroundColor, }) {
    const colorsetPath = path_1.default.resolve(iosNamedProjectRoot, exports.SPLASHSCREEN_COLORSET_PATH);
    // ensure old SplashScreen colorSet is removed
    await fs_1.default.promises.rm(colorsetPath, { force: true, recursive: true });
    await writeColorsContentsJsonFileAsync({
        assetPath: colorsetPath,
        backgroundColor,
        darkBackgroundColor: darkBackgroundColor ?? null,
    });
}
async function writeColorsContentsJsonFileAsync({ assetPath, backgroundColor, darkBackgroundColor, }) {
    const color = (0, InterfaceBuilder_1.parseColor)(backgroundColor);
    const darkColor = darkBackgroundColor ? (0, InterfaceBuilder_1.parseColor)(darkBackgroundColor) : null;
    const colors = [
        {
            color: {
                components: {
                    alpha: '1.000',
                    blue: color.rgb.blue,
                    green: color.rgb.green,
                    red: color.rgb.red,
                },
                'color-space': 'srgb',
            },
            idiom: 'universal',
        },
    ];
    if (darkColor) {
        colors.push({
            color: {
                components: {
                    alpha: '1.000',
                    blue: darkColor.rgb.blue,
                    green: darkColor.rgb.green,
                    red: darkColor.rgb.red,
                },
                'color-space': 'srgb',
            },
            idiom: 'universal',
            appearances: darkAppearances,
        });
    }
    debug(`create colors contents.json:`, assetPath);
    debug(`use colors:`, colors);
    await fs_1.default.promises.mkdir(assetPath, { recursive: true });
    await fs_1.default.promises.writeFile(path_1.default.join(assetPath, 'Contents.json'), JSON.stringify({
        colors,
        info: {
            version: 1,
            // common practice is for the tool that generated the icons to be the "author"
            author: 'expo',
        },
    }, null, 2), 'utf8');
}
