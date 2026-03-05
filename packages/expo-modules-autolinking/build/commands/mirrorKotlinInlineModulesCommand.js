"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mirrorKotlinInlineModulesCommand = mirrorKotlinInlineModulesCommand;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const autolinkingOptions_1 = require("./autolinkingOptions");
const androidInlineModules_1 = require("../inlineModules/androidInlineModules");
const inlineModules_1 = require("../inlineModules/inlineModules");
/**
 * A cli command which:
 * - creates InlineModulesList.kt file
 * - mirrors directory structure of watched directories
 * - symlinks the original kotlin files in the new mirror directories.
 */
function mirrorKotlinInlineModulesCommand(cli) {
    return (0, autolinkingOptions_1.registerAutolinkingArguments)(cli.command('mirror-kotlin-inline-modules'))
        .requiredOption('--kotlin-files-mirror-directory <path>', 'Directory in which to create mirrors of watched directories')
        .requiredOption('--inline-modules-list-directory <path>', 'Path to the directory in which to generate the inlineModulesList file.')
        .requiredOption('--watched-directories-serialized <watchedDirectories>', 'JSON serialized watched directories array')
        .action(async (commandArguments) => {
        const { kotlinFilesMirrorDirectory, inlineModulesListDirectory, watchedDirectoriesSerialized, } = commandArguments;
        const autolinkingOptionsLoader = (0, autolinkingOptions_1.createAutolinkingOptionsLoader)({
            ...commandArguments,
        });
        const appRoot = await autolinkingOptionsLoader.getAppRoot();
        const watchedDirectories = JSON.parse(watchedDirectoriesSerialized);
        if (!/.android./.test(kotlinFilesMirrorDirectory) ||
            !/.android./.test(inlineModulesListDirectory)) {
            throw new Error('Generation path is not inside any android directory!');
        }
        if (!path_1.default.isAbsolute(kotlinFilesMirrorDirectory) ||
            !path_1.default.isAbsolute(inlineModulesListDirectory)) {
            throw new Error('Need to provide the absolute path to both the kotlin files mirror and inline modules list directories!');
        }
        const inlineModulesMirror = await (0, inlineModules_1.getMirrorStateObject)(watchedDirectories, appRoot);
        const createMirrorStructurePromise = fs_1.default.promises
            .rm(kotlinFilesMirrorDirectory, { recursive: true, force: true })
            .then(() => (0, androidInlineModules_1.createSymlinksToKotlinFiles)(kotlinFilesMirrorDirectory, inlineModulesMirror));
        const generateInlineModulesListPromise = (0, androidInlineModules_1.generateInlineModulesListFile)(inlineModulesListDirectory, inlineModulesMirror);
        await Promise.all([createMirrorStructurePromise, generateInlineModulesListPromise]);
    });
}
//# sourceMappingURL=mirrorKotlinInlineModulesCommand.js.map