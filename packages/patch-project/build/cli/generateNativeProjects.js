"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformSanityCheckAsync = exports.generateNativeProjectsAsync = void 0;
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const dir_1 = require("./dir");
const resolveFromExpoCli_1 = require("./resolveFromExpoCli");
/**
 * Generates native projects for the given platforms.
 * This step is similar to the `expo prebuild` command but removes some validation.
 * @return The checksum of the template used to generate the native projects.
 */
async function generateNativeProjectsAsync(projectRoot, exp, options) {
    const { configureProjectAsync } = require((0, resolveFromExpoCli_1.resolveFromExpoCli)(projectRoot, 'build/src/prebuild/configureProjectAsync'));
    const { resolveTemplateOption } = require((0, resolveFromExpoCli_1.resolveFromExpoCli)(projectRoot, 'build/src/prebuild/resolveOptions'));
    const { cloneTemplateAndCopyToProjectAsync } = require((0, resolveFromExpoCli_1.resolveFromExpoCli)(projectRoot, 'build/src/prebuild/updateFromTemplate'));
    // Create native projects from template.
    const { templateChecksum } = await cloneTemplateAndCopyToProjectAsync({
        exp,
        projectRoot,
        template: options.template != null ? resolveTemplateOption(options.template) : undefined,
        templateDirectory: options.templateDirectory,
        platforms: options.platforms,
    });
    // Apply config-plugins to native projects.
    await configureProjectAsync(projectRoot, {
        platforms: options.platforms,
        exp,
    });
    // Install CocoaPods is a must on ios because some changes are happening in the `pod install` stage.
    // That would minimize the diff between the native projects.
    if (options.platforms.includes('ios')) {
        const { installCocoaPodsAsync } = require((0, resolveFromExpoCli_1.resolveFromExpoCli)(projectRoot, 'build/src/utils/cocoapods'));
        await installCocoaPodsAsync(projectRoot);
    }
    return templateChecksum;
}
exports.generateNativeProjectsAsync = generateNativeProjectsAsync;
/**
 * Sanity check for the native project before attempting to run patch-project.
 */
async function platformSanityCheckAsync({ exp, projectRoot, platform, }) {
    // Check platform directory exists and is not empty.
    const platformDir = path_1.default.join(projectRoot, platform);
    if (!(await (0, dir_1.directoryExistsAsync)(platformDir))) {
        throw new Error(`Platform directory does not exist: ${platformDir}`);
    }
    const files = await promises_1.default.readdir(platformDir);
    if (files.length === 0) {
        throw new Error(`Platform directory is empty: ${platformDir}`);
    }
    // Check package and bundle identifier are defined.
    if (platform === 'android' && !exp.android?.package) {
        throw new Error(`android.package is not defined in your app config. Please define it before running this command.`);
    }
    if (platform === 'ios' && !exp.ios?.bundleIdentifier) {
        throw new Error(`ios.bundleIdentifier is not defined in your app config. Please define it before running this command.`);
    }
    // Check if git is installed.
    try {
        await (0, spawn_async_1.default)('git', ['--version'], { stdio: 'ignore' });
    }
    catch (e) {
        if (e.code === 'ENOENT') {
            e.message += `\nGit is required to run this command. Install Git and try again.`;
        }
        throw e;
    }
}
exports.platformSanityCheckAsync = platformSanityCheckAsync;
//# sourceMappingURL=generateNativeProjects.js.map