"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.modifyJavaMainActivity = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const semver_1 = __importDefault(require("semver"));
const constants_1 = require("./constants");
const resolveExpoUpdatesVersion_1 = require("./resolveExpoUpdatesVersion");
const utils_1 = require("./utils");
const withDevLauncherAppDelegate_1 = require("./withDevLauncherAppDelegate");
const pkg = require('expo-dev-launcher/package.json');
const DEV_LAUNCHER_ANDROID_IMPORT = 'expo.modules.devlauncher.DevLauncherController';
const DEV_LAUNCHER_UPDATES_ANDROID_IMPORT = 'expo.modules.updates.UpdatesDevLauncherController';
const DEV_LAUNCHER_ON_NEW_INTENT = [
    '',
    '  @Override',
    '  public void onNewIntent(Intent intent) {',
    '    super.onNewIntent(intent);',
    '  }',
    '',
].join('\n');
const DEV_LAUNCHER_HANDLE_INTENT = [
    '    if (DevLauncherController.tryToHandleIntent(this, intent)) {',
    '      return;',
    '    }',
].join('\n');
const DEV_LAUNCHER_WRAPPED_ACTIVITY_DELEGATE = (activityDelegateDeclaration) => `DevLauncherController.wrapReactActivityDelegate(this, () -> ${activityDelegateDeclaration})`;
const DEV_LAUNCHER_ANDROID_INIT = 'DevLauncherController.initialize(this, getReactNativeHost());';
const DEV_LAUNCHER_UPDATES_ANDROID_INIT = `if (BuildConfig.DEBUG) {
      DevLauncherController.getInstance().setUpdatesInterface(UpdatesDevLauncherController.initialize(this));
    }`;
const DEV_LAUNCHER_UPDATES_DEVELOPER_SUPPORT = 'return DevLauncherController.getInstance().getUseDeveloperSupport();';
async function readFileAsync(path) {
    return fs_1.default.promises.readFile(path, 'utf8');
}
async function saveFileAsync(path, content) {
    return fs_1.default.promises.writeFile(path, content, 'utf8');
}
function findClosingBracketMatchIndex(str, pos) {
    if (str[pos] !== '(') {
        throw new Error("No '(' at index " + pos);
    }
    let depth = 1;
    for (let i = pos + 1; i < str.length; i++) {
        switch (str[i]) {
            case '(':
                depth++;
                break;
            case ')':
                if (--depth === 0) {
                    return i;
                }
                break;
        }
    }
    return -1; // No matching closing parenthesis
}
const replaceBetween = (origin, startIndex, endIndex, insertion) => `${origin.substring(0, startIndex)}${insertion}${origin.substring(endIndex)}`;
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
async function editMainApplication(config, action) {
    const mainApplicationPath = path_1.default.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'java', ...config.android.package.split('.'), 'MainApplication.java');
    try {
        const mainApplication = action(await readFileAsync(mainApplicationPath));
        return await saveFileAsync(mainApplicationPath, mainApplication);
    }
    catch (e) {
        config_plugins_1.WarningAggregator.addWarningAndroid('expo-dev-launcher', `Couldn't modify MainApplication.java - ${e}.
See the expo-dev-client installation instructions to modify your MainApplication.java manually: ${constants_1.InstallationPage}`);
    }
}
async function editPodfile(config, action) {
    const podfilePath = path_1.default.join(config.modRequest.platformProjectRoot, 'Podfile');
    try {
        const podfile = action(await readFileAsync(podfilePath));
        return await saveFileAsync(podfilePath, podfile);
    }
    catch (e) {
        config_plugins_1.WarningAggregator.addWarningIOS('expo-dev-launcher', `Couldn't modify AppDelegate.m - ${e}.
See the expo-dev-client installation instructions to modify your AppDelegate.m manually: ${constants_1.InstallationPage}`);
    }
}
const withDevLauncherApplication = (config) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        async (config) => {
            await editMainApplication(config, (mainApplication) => {
                mainApplication = addJavaImports(mainApplication, [DEV_LAUNCHER_ANDROID_IMPORT]);
                mainApplication = (0, utils_1.addLines)(mainApplication, 'initializeFlipper\\(this', 0, [
                    `    ${DEV_LAUNCHER_ANDROID_INIT}`,
                ]);
                let expoUpdatesVersion;
                try {
                    expoUpdatesVersion = (0, resolveExpoUpdatesVersion_1.resolveExpoUpdatesVersion)(config.modRequest.projectRoot);
                }
                catch (e) {
                    config_plugins_1.WarningAggregator.addWarningAndroid('expo-dev-launcher', `Failed to check compatibility with expo-updates - ${e}`);
                }
                if (expoUpdatesVersion && semver_1.default.gt(expoUpdatesVersion, '0.6.0')) {
                    mainApplication = addJavaImports(mainApplication, [DEV_LAUNCHER_UPDATES_ANDROID_IMPORT]);
                    mainApplication = (0, utils_1.addLines)(mainApplication, 'initializeFlipper\\(this', 0, [
                        `    ${DEV_LAUNCHER_UPDATES_ANDROID_INIT}`,
                    ]);
                    mainApplication = (0, utils_1.replaceLine)(mainApplication, 'return BuildConfig.DEBUG;', `      ${DEV_LAUNCHER_UPDATES_DEVELOPER_SUPPORT}`);
                }
                return mainApplication;
            });
            return config;
        },
    ]);
};
function modifyJavaMainActivity(content) {
    content = addJavaImports(content, [DEV_LAUNCHER_ANDROID_IMPORT, 'android.content.Intent']);
    if (!content.includes('onNewIntent')) {
        const lines = content.split('\n');
        const onCreateIndex = lines.findIndex((line) => line.includes('public class MainActivity'));
        lines.splice(onCreateIndex + 1, 0, DEV_LAUNCHER_ON_NEW_INTENT);
        content = lines.join('\n');
    }
    if (!content.includes(DEV_LAUNCHER_HANDLE_INTENT)) {
        content = (0, utils_1.addLines)(content, /super\.onNewIntent\(intent\)/, 0, [DEV_LAUNCHER_HANDLE_INTENT]);
    }
    if (!content.includes('DevLauncherController.wrapReactActivityDelegate')) {
        const activityDelegateMatches = Array.from(content.matchAll(/new ReactActivityDelegate(Wrapper)/g));
        if (activityDelegateMatches.length !== 1) {
            config_plugins_1.WarningAggregator.addWarningAndroid('expo-dev-launcher', `Failed to wrap 'ReactActivityDelegate'
See the expo-dev-client installation instructions to modify your MainActivity.java manually: ${constants_1.InstallationPage}`);
            return content;
        }
        const activityDelegateMatch = activityDelegateMatches[0];
        const matchIndex = activityDelegateMatch.index;
        const openingBracketIndex = matchIndex + activityDelegateMatch[0].length; // next character after `new ReactActivityDelegateWrapper`
        const closingBracketIndex = findClosingBracketMatchIndex(content, openingBracketIndex);
        const reactActivityDelegateDeclaration = content.substring(matchIndex, closingBracketIndex + 1);
        content = replaceBetween(content, matchIndex, closingBracketIndex + 1, DEV_LAUNCHER_WRAPPED_ACTIVITY_DELEGATE(reactActivityDelegateDeclaration));
    }
    return content;
}
exports.modifyJavaMainActivity = modifyJavaMainActivity;
const withDevLauncherActivity = (config) => {
    return (0, config_plugins_1.withMainActivity)(config, (config) => {
        if (config.modResults.language === 'java') {
            config.modResults.contents = modifyJavaMainActivity(config.modResults.contents);
        }
        else {
            config_plugins_1.WarningAggregator.addWarningAndroid('expo-dev-launcher', `Cannot automatically configure MainActivity if it's not java.
See the expo-dev-client installation instructions to modify your MainActivity manually: ${constants_1.InstallationPage}`);
        }
        return config;
    });
};
const withDevLauncherPodfile = (config) => {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'ios',
        async (config) => {
            await editPodfile(config, (podfile) => {
                // replace all iOS versions below 12
                podfile = podfile.replace(/platform :ios, '((\d\.0)|(1[0-1].0))'/, "platform :ios, '12.0'");
                // Match both variations of Ruby config:
                // unknown: pod 'expo-dev-launcher', path: '../node_modules/expo-dev-launcher', :configurations => :debug
                // Rubocop: pod 'expo-dev-launcher', path: '../node_modules/expo-dev-launcher', configurations: :debug
                if (!podfile.match(/pod ['"]expo-dev-launcher['"],\s?path: ['"][^'"]*node_modules\/expo-dev-launcher['"],\s?:?configurations:?\s(?:=>\s)?:debug/)) {
                    const packagePath = path_1.default.dirname(require.resolve('expo-dev-launcher/package.json'));
                    const relativePath = path_1.default.relative(config.modRequest.platformProjectRoot, packagePath);
                    podfile = (0, utils_1.addLines)(podfile, 'use_react_native', 0, [
                        `  pod 'expo-dev-launcher', path: '${relativePath}', :configurations => :debug`,
                    ]);
                }
                return podfile;
            });
            return config;
        },
    ]);
};
const withDevLauncher = (config) => {
    // projects using SDKs before 45 need the old regex-based integration
    // TODO: remove these once we drop support for SDK 44
    if (config.sdkVersion && semver_1.default.lt(config.sdkVersion, '45.0.0')) {
        config = withDevLauncherActivity(config);
        config = withDevLauncherApplication(config);
        config = withDevLauncherPodfile(config);
        config = (0, withDevLauncherAppDelegate_1.withDevLauncherAppDelegate)(config);
    }
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withDevLauncher, pkg.name, pkg.version);
