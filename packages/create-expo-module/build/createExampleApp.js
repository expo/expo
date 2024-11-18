"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExampleApp = void 0;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const getenv_1 = __importDefault(require("getenv"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const packageManager_1 = require("./packageManager");
const ora_1 = require("./utils/ora");
const debug = require('debug')('create-expo-module:createExampleApp');
// These dependencies will be removed from the example app (`expo init` adds them)
const DEPENDENCIES_TO_REMOVE = ['expo-status-bar', 'expo-splash-screen'];
const EXPO_BETA = getenv_1.default.boolish('EXPO_BETA', false);
/**
 * Initializes a new Expo project as an example app.
 */
async function createExampleApp(data, targetDir, packageManager) {
    // Package name for the example app
    const exampleProjectSlug = `${data.project.slug}-example`;
    // `expo init` creates a new folder with the same name as the project slug
    const appTmpPath = path_1.default.join(targetDir, exampleProjectSlug);
    // Path to the target example dir
    const appTargetPath = path_1.default.join(targetDir, 'example');
    if (!(await fs_extra_1.default.pathExists(appTargetPath))) {
        // The template doesn't include the example app, so just skip this phase
        return;
    }
    await (0, ora_1.newStep)('Initializing the example app', async (step) => {
        const templateVersion = EXPO_BETA ? 'next' : 'latest';
        const template = `expo-template-blank-typescript@${templateVersion}`;
        debug(`Using example template: ${template}`);
        const command = createCommand(packageManager, exampleProjectSlug, template);
        try {
            await (0, spawn_async_1.default)(packageManager, command, {
                cwd: targetDir,
            });
        }
        catch (error) {
            throw new Error(`${command.join(' ')} failed with exit code: ${error?.status}.\n\nError stack:\n${error?.stderr}`);
        }
        step.succeed('Initialized the example app');
    });
    await (0, ora_1.newStep)('Configuring the example app', async (step) => {
        // "example" folder already exists and contains template files,
        // that should replace these created by `expo init`.
        await moveFiles(appTargetPath, appTmpPath);
        // Cleanup the "example" dir
        await fs_extra_1.default.rmdir(appTargetPath);
        // Clean up the ".git" from example app
        // note, this directory has contents, rmdir will throw
        await fs_extra_1.default.remove(path_1.default.join(appTmpPath, '.git'));
        // Move the temporary example app to "example" dir
        await fs_extra_1.default.rename(appTmpPath, appTargetPath);
        await addMissingAppConfigFields(appTargetPath, data);
        step.succeed('Configured the example app');
    });
    await prebuildExampleApp(appTargetPath);
    await modifyPackageJson(appTargetPath);
    await (0, ora_1.newStep)('Installing dependencies in the example app', async (step) => {
        await (0, packageManager_1.installDependencies)(packageManager, appTargetPath);
        if (os_1.default.platform() === 'darwin') {
            await podInstall(appTargetPath);
            step.succeed('Installed dependencies in the example app');
        }
        else {
            step.succeed('Installed dependencies in the example app (skipped installing CocoaPods)');
        }
    });
}
exports.createExampleApp = createExampleApp;
function createCommand(packageManager, exampleProjectSlug, template) {
    const command = ['create', 'expo-app'];
    if (packageManager === 'npm') {
        command.push('--');
    }
    return command.concat([exampleProjectSlug, '--template', template, '--yes']);
}
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
 * Adds missing configuration that are required to run `npx expo prebuild`.
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
 * Runs `npx expo prebuild` in the example app.
 */
async function prebuildExampleApp(exampleAppPath) {
    await (0, ora_1.newStep)('Prebuilding the example app', async (step) => {
        await (0, spawn_async_1.default)('npx', ['expo', 'prebuild', '--no-install'], {
            cwd: exampleAppPath,
            stdio: ['ignore', 'ignore', 'pipe'],
        });
        step.succeed('Prebuilt the example app');
    });
}
/**
 * Runs `pod install` in the iOS project at the given path.
 */
async function podInstall(appPath) {
    await (0, spawn_async_1.default)('pod', ['install'], {
        cwd: path_1.default.join(appPath, 'ios'),
        stdio: ['ignore', 'ignore', 'pipe'],
    });
}
//# sourceMappingURL=createExampleApp.js.map