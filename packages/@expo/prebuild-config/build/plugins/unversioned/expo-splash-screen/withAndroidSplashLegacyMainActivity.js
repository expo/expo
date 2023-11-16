"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSplashScreenLegacyMainActivity = exports.withAndroidSplashLegacyMainActivity = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const codeMod_1 = require("@expo/config-plugins/build/android/codeMod");
const generateCode_1 = require("@expo/config-plugins/build/utils/generateCode");
const debug_1 = __importDefault(require("debug"));
const getAndroidSplashConfig_1 = require("./getAndroidSplashConfig");
const debug = (0, debug_1.default)('expo:prebuild-config:expo-splash-screen:android:mainActivity');
// DO NOT CHANGE
const SHOW_SPLASH_ID = 'expo-splash-screen-mainActivity-onCreate-show-splash';
const withAndroidSplashLegacyMainActivity = (config) => {
    return (0, config_plugins_1.withMainActivity)(config, (config) => {
        config.modResults.contents = setSplashScreenLegacyMainActivity(config, config.modResults.contents, config.modResults.language);
        return config;
    });
};
exports.withAndroidSplashLegacyMainActivity = withAndroidSplashLegacyMainActivity;
function setSplashScreenLegacyMainActivity(config, mainActivity, language) {
    debug(`Modify with language: "${language}"`);
    const splashConfig = (0, getAndroidSplashConfig_1.getAndroidSplashConfig)(config);
    if (!splashConfig) {
        // Remove our generated code safely...
        const mod = (0, generateCode_1.removeContents)({
            src: mainActivity,
            tag: SHOW_SPLASH_ID,
        });
        mainActivity = mod.contents;
        if (mod.didClear) {
            debug('Removed SplashScreen.show()');
        }
        return mainActivity;
    }
    // TODO: Translucent is weird
    const statusBarTranslucent = !!config.androidStatusBar?.translucent;
    const { resizeMode } = splashConfig;
    const isJava = language === 'java';
    const LE = isJava ? ';' : '';
    mainActivity = (0, codeMod_1.addImports)(mainActivity, [
        'expo.modules.splashscreen.SplashScreen',
        'expo.modules.splashscreen.SplashScreenImageResizeMode',
        'android.os.Bundle',
    ], isJava);
    if (!mainActivity.match(/(?<=^.*super\.onCreate.*$)/m)) {
        const onCreateBlock = isJava
            ? [
                '    @Override',
                '    protected void onCreate(Bundle savedInstanceState) {',
                '      super.onCreate(savedInstanceState);',
                '    }',
            ]
            : [
                '    override fun onCreate(savedInstanceState: Bundle?) {',
                '      super.onCreate(savedInstanceState)',
                '    }',
            ];
        mainActivity = (0, generateCode_1.mergeContents)({
            src: mainActivity,
            // insert just below super.onCreate
            anchor: isJava
                ? /(?<=public\s+class\s+.*\s+extends\s+.*\s+{.*$)/m
                : /(?<=class\s+.*\s+:\s+.*\s+{.*$)/m,
            offset: 1,
            comment: '//',
            tag: 'expo-splash-screen-mainActivity-onCreate',
            newSrc: onCreateBlock.join('\n'),
        }).contents;
    }
    // Remove our generated code safely...
    mainActivity = (0, generateCode_1.removeContents)({
        src: mainActivity,
        tag: SHOW_SPLASH_ID,
    }).contents;
    // Remove code from `@expo/configure-splash-screen`
    mainActivity = mainActivity
        .split('\n')
        .filter((line) => {
        return !/SplashScreen\.show\(this,\s?SplashScreenImageResizeMode\./.test(line);
    })
        .join('\n');
    // Reapply generated code.
    mainActivity = (0, generateCode_1.mergeContents)({
        src: mainActivity,
        // insert just below super.onCreate
        anchor: /(?<=^.*super\.onCreate.*$)/m,
        offset: 1,
        comment: '//',
        tag: SHOW_SPLASH_ID,
        newSrc: `    SplashScreen.show(this, SplashScreenImageResizeMode.${resizeMode.toUpperCase()}, ReactRootView${isJava ? '.class' : '::class.java'}, ${statusBarTranslucent})${LE}`,
    }).contents;
    // TODO: Remove old `SplashScreen.show`
    return mainActivity;
}
exports.setSplashScreenLegacyMainActivity = setSplashScreenLegacyMainActivity;
