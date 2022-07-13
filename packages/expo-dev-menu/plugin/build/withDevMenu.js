"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const semver_1 = __importDefault(require("semver"));
const constants_1 = require("./constants");
const withDevMenuAppDelegate_1 = require("./withDevMenuAppDelegate");
const pkg = require('expo-dev-menu/package.json');
const DEV_MENU_ANDROID_IMPORT = 'expo.modules.devmenu.react.DevMenuAwareReactActivity';
const DEV_MENU_ACTIVITY_CLASS = 'public class MainActivity extends DevMenuAwareReactActivity {';
async function readFileAsync(path) {
    return fs_1.default.promises.readFile(path, 'utf8');
}
async function saveFileAsync(path, content) {
    return fs_1.default.promises.writeFile(path, content, 'utf8');
}
function addJavaImports(javaSource, javaImports) {
    const lines = javaSource.split('\n');
    const lineIndexWithPackageDeclaration = lines.findIndex((line) => line.match(/^package .*;$/));
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
    let lineIndex = lines.findIndex((line) => line.match(find));
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
        config_plugins_1.WarningAggregator.addWarningIOS('expo-dev-menu', `Couldn't modified AppDelegate.m - ${e}. 
See the expo-dev-client installation instructions to modify your AppDelegate manually: ${constants_1.InstallationPage}`);
    }
}
const withDevMenuActivity = (config) => {
    return (0, config_plugins_1.withMainActivity)(config, (config) => {
        if (config.modResults.language === 'java') {
            let content = config.modResults.contents;
            content = addJavaImports(content, [DEV_MENU_ANDROID_IMPORT]);
            content = content.replace('public class MainActivity extends ReactActivity {', DEV_MENU_ACTIVITY_CLASS);
            config.modResults.contents = content;
        }
        else {
            config_plugins_1.WarningAggregator.addWarningAndroid('expo-dev-menu', `Cannot automatically configure MainActivity if it's not java.
See the expo-dev-client installation instructions to modify your MainActivity manually: ${constants_1.InstallationPage}`);
        }
        return config;
    });
};
const withDevMenuPodfile = (config) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'ios',
        async (config) => {
            await editPodfile(config, (podfile) => {
                podfile = podfile.replace("platform :ios, '10.0'", "platform :ios, '11.0'");
                // Match both variations of Ruby config:
                // unknown: pod 'expo-dev-menu', path: '../node_modules/expo-dev-menu', :configurations => :debug
                // Rubocop: pod 'expo-dev-menu', path: '../node_modules/expo-dev-menu', configurations: :debug
                if (!podfile.match(/pod ['"]expo-dev-menu['"],\s?path: ['"][^'"]*node_modules\/expo-dev-menu['"],\s?:?configurations:?\s(?:=>\s)?:debug/)) {
                    const packagePath = path_1.default.dirname(require.resolve('expo-dev-menu/package.json'));
                    const relativePath = path_1.default.relative(config.modRequest.platformProjectRoot, packagePath);
                    podfile = addLines(podfile, 'use_react_native', 0, [
                        `  pod 'expo-dev-menu', path: '${relativePath}', :configurations => :debug`,
                    ]);
                }
                return podfile;
            });
            return config;
        },
    ]);
};
const withDevMenu = (config) => {
    // projects using SDKs before 45 need the old regex-based integration
    // TODO: remove this config plugin once we drop support for SDK 44
    if (config.sdkVersion && semver_1.default.lt(config.sdkVersion, '45.0.0')) {
        config = withDevMenuActivity(config);
        config = withDevMenuPodfile(config);
        config = (0, withDevMenuAppDelegate_1.withDevMenuAppDelegate)(config);
    }
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withDevMenu, pkg.name, pkg.version);
