"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExampleApp = void 0;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const packageManager_1 = require("./packageManager");
// These dependencies will be removed from the example app (`expo init` adds them)
const DEPENDENCIES_TO_REMOVE = ['expo-status-bar', 'expo-splash-screen'];
/**
 * Initializes a new Expo project as an example app.
 */
async function createExampleApp(data, targetDir, packageManager) {
    console.log('🎭 Creating the example app...');
    const exampleProjectSlug = `${data.project.slug}-example`;
    await (0, spawn_async_1.default)('expo', ['init', exampleProjectSlug, '--template', 'expo-template-blank-typescript'], {
        cwd: targetDir,
        stdio: ['ignore', 'ignore', 'inherit'],
    });
    // `expo init` creates a new folder with the same name as the project slug
    const appTmpPath = path_1.default.join(targetDir, exampleProjectSlug);
    // Path to the target example dir
    const appTargetPath = path_1.default.join(targetDir, 'example');
    console.log('🛠  Configuring the example app...');
    // "example" folder already exists and contains template files,
    // that should replace these created by `expo init`.
    await moveFiles(appTargetPath, appTmpPath);
    // Cleanup the "example" dir
    await fs_extra_1.default.rmdir(appTargetPath);
    // Move the temporary example app to "example" dir
    await fs_extra_1.default.rename(appTmpPath, appTargetPath);
    await addMissingAppConfigFields(appTargetPath, data);
    console.log('👷 Prebuilding the example app...');
    await prebuildExampleApp(appTargetPath);
    await modifyPackageJson(appTargetPath);
    console.log('📦 Installing dependencies in the example app...');
    await (0, packageManager_1.installDependencies)(packageManager, appTargetPath);
    console.log('🥥 Installing iOS pods in the example app...');
    await podInstall(appTargetPath);
}
exports.createExampleApp = createExampleApp;
/**
 * Copies files from one directory to another.
 */
async function moveFiles(fromPath, toPath) {
    for (const file of await fs_extra_1.default.readdir(fromPath)) {
        await fs_extra_1.default.move(path_1.default.join(fromPath, file), path_1.default.join(toPath, file), {
            overwrite: true,
        });
    }
}
/**
 * Adds missing configuration that are required to run `expo prebuild`.
 */
async function addMissingAppConfigFields(appPath, data) {
    const appConfigPath = path_1.default.join(appPath, 'app.json');
    const appConfig = await fs_extra_1.default.readJson(appConfigPath);
    const appId = `${data.project.package}.example`;
    // Android package name needs to be added to app.json
    if (!appConfig.expo.android) {
        appConfig.expo.android = {};
    }
    appConfig.expo.android.package = appId;
    // Specify iOS bundle identifier
    if (!appConfig.expo.ios) {
        appConfig.expo.ios = {};
    }
    appConfig.expo.ios.bundleIdentifier = appId;
    await fs_extra_1.default.writeJson(appConfigPath, appConfig, {
        spaces: 2,
    });
}
/**
 * Applies necessary changes to **package.json** of the example app.
 * It means setting the autolinking config and removing unnecessary dependencies.
 */
async function modifyPackageJson(appPath) {
    const packageJsonPath = path_1.default.join(appPath, 'package.json');
    const packageJson = await fs_extra_1.default.readJson(packageJsonPath);
    if (!packageJson.expo) {
        packageJson.expo = {};
    }
    // Set the native modules dir to the root folder,
    // so that the autolinking can detect and link the module.
    packageJson.expo.autolinking = {
        nativeModulesDir: '..',
    };
    // Remove unnecessary dependencies
    for (const dependencyToRemove of DEPENDENCIES_TO_REMOVE) {
        delete packageJson.dependencies[dependencyToRemove];
    }
    await fs_extra_1.default.writeJson(packageJsonPath, packageJson, {
        spaces: 2,
    });
}
/**
 * Runs `expo prebuild` in the example app.
 */
async function prebuildExampleApp(exampleAppPath) {
    try {
        await (0, spawn_async_1.default)('expo', ['prebuild', '--no-install'], {
            cwd: exampleAppPath,
            stdio: ['ignore', 'ignore', 'pipe'],
        });
    }
    catch (error) {
        console.error(error.stderr);
        process.exit(1);
    }
}
/**
 * Runs `pod install` in the iOS project at the given path.
 */
async function podInstall(appPath) {
    try {
        await (0, spawn_async_1.default)('pod', ['install'], {
            cwd: path_1.default.join(appPath, 'ios'),
            stdio: ['ignore', 'ignore', 'pipe'],
        });
    }
    catch (error) {
        console.error(error.stderr);
        process.exit(1);
    }
}
//# sourceMappingURL=createExampleApp.js.map