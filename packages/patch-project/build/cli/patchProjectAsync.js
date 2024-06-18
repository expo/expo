"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchProjectAsync = void 0;
const config_1 = require("@expo/config");
const chalk_1 = __importDefault(require("chalk"));
const promises_1 = __importDefault(require("fs/promises"));
const glob_1 = require("glob");
const path_1 = __importDefault(require("path"));
const dir_1 = require("./dir");
const generateNativeProjects_1 = require("./generateNativeProjects");
const logger = __importStar(require("./logger"));
const normalizeNativeProjects_1 = require("./normalizeNativeProjects");
const resolveFromExpoCli_1 = require("./resolveFromExpoCli");
const workingDirectories_1 = require("./workingDirectories");
const gitPatch_1 = require("../gitPatch");
const debug = require('debug')('patch-project');
/**
 * Entry point into the patch-project process.
 */
async function patchProjectAsync(projectRoot, options) {
    const { ensureValidPlatforms } = require((0, resolveFromExpoCli_1.resolveFromExpoCli)(projectRoot, 'build/src/prebuild/resolveOptions'));
    const { setNodeEnv } = require((0, resolveFromExpoCli_1.resolveFromExpoCli)(projectRoot, 'build/src/utils/nodeEnv'));
    setNodeEnv('development');
    require('@expo/env').load(projectRoot);
    const { exp } = await (0, config_1.getConfig)(projectRoot);
    const patchRoot = options.patchRoot || 'cng-patches';
    // Warn if the project is attempting to prebuild an unsupported platform (iOS on Windows).
    options.platforms = ensureValidPlatforms(options.platforms);
    for (const platform of options.platforms) {
        await (0, generateNativeProjects_1.platformSanityCheckAsync)({ exp, projectRoot, platform });
        const workingDirectories = await (0, workingDirectories_1.createWorkingDirectoriesAsync)(projectRoot, platform);
        try {
            await removePatchFilesAsync(patchRoot, platform);
            await promises_1.default.mkdir(path_1.default.join(projectRoot, patchRoot), { recursive: true });
            await patchProjectForPlatformAsync({
                projectRoot,
                platform,
                workingDirectories,
                patchRoot,
                exp,
                options,
            });
        }
        finally {
            await promises_1.default.rm(workingDirectories.rootDir, { recursive: true, force: true });
        }
    }
}
exports.patchProjectAsync = patchProjectAsync;
async function patchProjectForPlatformAsync({ projectRoot, platform, workingDirectories, patchRoot, exp, options, }) {
    const { diffDir, originDir } = workingDirectories;
    debug(`Normalizing native project files for original project`);
    const backupFileMappings = await (0, normalizeNativeProjects_1.normalizeNativeProjectsAsync)({
        projectRoot,
        platform,
        workingDirectories,
        backup: true,
    });
    debug(`Moving native projects to origin directory - originDir[${originDir}]`);
    await promises_1.default.rename(path_1.default.join(projectRoot, platform), originDir);
    debug(`Generating native projects from prebuild template - projectRoot[${projectRoot}]`);
    logger.log(chalk_1.default.bold(`Generating native projects from prebuild template - platform[${platform}]`));
    const templateChecksum = await (0, generateNativeProjects_1.generateNativeProjectsAsync)(projectRoot, exp, {
        platforms: [platform],
        template: options.template,
        templateDirectory: workingDirectories.templateDir,
    });
    debug(`Normalizing native project files for generated project`);
    await (0, normalizeNativeProjects_1.normalizeNativeProjectsAsync)({
        projectRoot,
        platform,
        workingDirectories,
        backup: false,
    });
    debug(`Initializing git repo for diff - diffDir[${diffDir}]`);
    const platformDiffDir = path_1.default.join(diffDir, platform);
    await (0, gitPatch_1.initializeGitRepoAsync)(diffDir);
    await (0, dir_1.moveAsync)(path_1.default.join(projectRoot, platform), platformDiffDir);
    await (0, gitPatch_1.addAllToGitIndexAsync)(diffDir);
    await (0, gitPatch_1.commitAsync)(diffDir, 'Base commit from prebuild template');
    debug(`Moving the original native projects to diff repo`);
    await promises_1.default.rm(platformDiffDir, { recursive: true, force: true });
    await (0, dir_1.moveAsync)(originDir, platformDiffDir);
    debug(`Generating patch file`);
    const patchFilePath = path_1.default.join(projectRoot, patchRoot, `${platform}+${templateChecksum}.patch`);
    logger.log(chalk_1.default.bold(`Saving patch file to ${patchFilePath}`));
    await (0, gitPatch_1.diffAsync)(diffDir, patchFilePath, options.diffOptions ?? []);
    const stat = await promises_1.default.stat(patchFilePath);
    if (stat.size === 0) {
        logger.log(`No changes detected, removing the patch file: ${patchFilePath}`);
        await promises_1.default.rm(patchFilePath);
    }
    if (!options.clean) {
        debug(`Moving the original native projects back to project root`);
        await (0, dir_1.moveAsync)(platformDiffDir, path_1.default.join(projectRoot, platform));
        await (0, normalizeNativeProjects_1.revertNormalizeNativeProjectsAsync)(backupFileMappings);
    }
}
async function removePatchFilesAsync(patchRoot, platform) {
    const patchFiles = await (0, glob_1.glob)(`${platform}*.patch`, { cwd: patchRoot, absolute: true });
    await Promise.all(patchFiles.map((file) => {
        logger.log(`Removing patch file: ${file}`);
        return promises_1.default.rm(file, { force: true });
    }));
}
//# sourceMappingURL=patchProjectAsync.js.map