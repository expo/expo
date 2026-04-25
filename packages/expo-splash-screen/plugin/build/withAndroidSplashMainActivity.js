"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAndroidSplashMainActivity = void 0;
const codeMod_1 = require("@expo/config-plugins/build/android/codeMod");
const generateCode_1 = require("@expo/config-plugins/build/utils/generateCode");
const config_plugins_1 = require("expo/config-plugins");
const withAndroidSplashMainActivity = (config) => {
    return (0, config_plugins_1.withMainActivity)(config, (config) => {
        const { modResults } = config;
        const { language } = modResults;
        const withImports = (0, codeMod_1.addImports)(modResults.contents.replace(/(\/\/ )?setTheme\(R\.style\.AppTheme\)/, '// setTheme(R.style.AppTheme)'), ['expo.modules.splashscreen.SplashScreenManager'], language === 'java');
        const init = (0, generateCode_1.mergeContents)({
            src: withImports,
            comment: '    //',
            tag: 'expo-splashscreen',
            offset: 0,
            anchor: /super\.onCreate\(null\)/,
            newSrc: '    SplashScreenManager.registerOnActivity(this)' + (language === 'java' ? ';' : ''),
        });
        return {
            ...config,
            modResults: {
                ...modResults,
                contents: init.contents,
            },
        };
    });
};
exports.withAndroidSplashMainActivity = withAndroidSplashMainActivity;
