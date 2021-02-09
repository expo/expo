"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DEV_MENU_ANDROID_IMPORT = 'expo.modules.devmenu.react.DevMenuAwareReactActivity';
const DEV_MENU_ACTIVITY_CLASS = 'public class MainActivity extends DevMenuAwareReactActivity {';
const DEV_MENU_POD_IMPORT = "pod 'expo-dev-menu', path: '../node_modules/expo-dev-menu', :configurations => :debug";
const DEV_MENU_IOS_IMPORT = `
#if defined(EX_DEV_MENU_ENABLED)
@import EXDevMenu;
#endif`;
const DEV_MENU_IOS_INIT = `
#if defined(EX_DEV_MENU_ENABLED)
  [DevMenuManager configureWithBridge:bridge];
#endif`;
async function readFileAsync(path) {
    return fs_1.default.promises.readFile(path, 'utf8');
}
async function saveFileAsync(path, content) {
    return fs_1.default.promises.writeFile(path, content, 'utf8');
}
function addJavaImports(javaSource, javaImports) {
    const lines = javaSource.split('\n');
    const lineIndexWithPackageDeclaration = lines.findIndex(line => line.match(/^package .*;$/));
    for (const javaImport of javaImports) {
        if (!javaSource.includes(javaImport)) {
            const importStatement = `import ${javaImport};`;
            lines.splice(lineIndexWithPackageDeclaration + 1, 0, importStatement);
        }
    }
    return lines.join('\n');
}
function addLines(content, find, offset, toAdd) {
    const lines = content.split('\n');
    let lineIndex = lines.findIndex(line => line.match(find));
    for (const newLine of toAdd) {
        if (!content.includes(newLine)) {
            lines.splice(lineIndex + offset, 0, newLine);
            lineIndex++;
        }
    }
    return lines.join('\n');
}
async function editPodfile(config, action) {
    const podfilePath = path_1.default.join(config.modRequest.platformProjectRoot, 'Podfile');
    try {
        const podfile = action(await readFileAsync(podfilePath));
        return await saveFileAsync(podfilePath, podfile);
    }
    catch (e) {
        config_plugins_1.WarningAggregator.addWarningIOS('ios-devMenu', `Couldn't modified AppDelegate.m - ${e}.`);
    }
}
async function editAppDelegate(config, action) {
    const appDelegatePath = path_1.default.join(config.modRequest.platformProjectRoot, config.modRequest.projectName, 'AppDelegate.m');
    try {
        const appDelegate = action(await readFileAsync(appDelegatePath));
        return await saveFileAsync(appDelegatePath, appDelegate);
    }
    catch (e) {
        config_plugins_1.WarningAggregator.addWarningIOS('ios-devMenu', `Couldn't modified AppDelegate.m - ${e}.`);
    }
}
const withDevMenuActivity = config => {
    return config_plugins_1.withMainActivity(config, config => {
        if (config.modResults.language === 'java') {
            let content = config.modResults.contents;
            content = addJavaImports(content, [DEV_MENU_ANDROID_IMPORT]);
            content = content.replace('public class MainActivity extends ReactActivity {', DEV_MENU_ACTIVITY_CLASS);
            config.modResults.contents = content;
        }
        else {
            config_plugins_1.WarningAggregator.addWarningAndroid('android-devMenu', `Cannot automatically configure MainActivity if it's not java`);
        }
        return config;
    });
};
const withDevMenuPodfile = config => {
    return config_plugins_1.withDangerousMod(config, [
        'ios',
        async (config) => {
            await editPodfile(config, podfile => {
                podfile = podfile.replace("platform :ios, '10.0'", "platform :ios, '11.0'");
                // podfile = addLines(podfile, 'use_react_native', 0, [`  ${DEV_MENU_POD_IMPORT}`]);
                return podfile;
            });
            return config;
        },
    ]);
};
const withDevMenuAppDelegate = config => {
    return config_plugins_1.withDangerousMod(config, [
        'ios',
        async (config) => {
            await editAppDelegate(config, appDelegate => {
                if (!appDelegate.includes(DEV_MENU_IOS_IMPORT)) {
                    const lines = appDelegate.split('\n');
                    lines.splice(1, 0, DEV_MENU_IOS_IMPORT);
                    appDelegate = lines.join('\n');
                }
                if (!appDelegate.includes(DEV_MENU_IOS_INIT)) {
                    const lines = appDelegate.split('\n');
                    const initializeReactNativeAppIndex = lines.findIndex(line => line.includes('- (RCTBridge *)initializeReactNativeApp'));
                    const rootViewControllerIndex = lines.findIndex((line, index) => initializeReactNativeAppIndex < index && line.includes('rootViewController'));
                    lines.splice(rootViewControllerIndex - 1, 0, DEV_MENU_IOS_INIT);
                    appDelegate = lines.join('\n');
                }
                return appDelegate;
            });
            return config;
        },
    ]);
};
const withDevMenu = (config) => {
    config = withDevMenuActivity(config);
    config = withDevMenuPodfile(config);
    config = withDevMenuAppDelegate(config);
    return config;
};
exports.default = withDevMenu;
