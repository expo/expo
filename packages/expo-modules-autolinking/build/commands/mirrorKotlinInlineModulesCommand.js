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
function mirrorKotlinInlineModulesCommand(cli) {
    return (0, autolinkingOptions_1.registerAutolinkingArguments)(cli.command('mirror-kotlin-inline-modules <kotlinFilesMirrorDirectory> <inlineModulesListPath> <watchedDirectoriesSerialized>')).action(async (kotlinFilesMirrorDirectory, inlineModulesListPath, watchedDirectoriesSerialized) => {
        const watchedDirectories = JSON.parse(watchedDirectoriesSerialized);
        if (!kotlinFilesMirrorDirectory || !inlineModulesListPath) {
            throw new Error('Need to provide kotlinFilesMirrorDirectory and inlineModulesListPath!');
        }
        if (!/.android./.test(kotlinFilesMirrorDirectory) ||
            !/.android./.test(inlineModulesListPath)) {
            throw new Error('Generation path is not inside any android directory!');
        }
        if (!path_1.default.isAbsolute(kotlinFilesMirrorDirectory) || !path_1.default.isAbsolute(inlineModulesListPath)) {
            throw new Error('Need to provide the absolute path to both the local modules src mirror and generated mirror directory!');
        }
        fs_1.default.rmSync(kotlinFilesMirrorDirectory, { recursive: true, force: true });
        await (0, androidInlineModules_1.createSymlinksToKotlinFiles)(kotlinFilesMirrorDirectory, watchedDirectories);
        await (0, androidInlineModules_1.generateInlineModulesListFile)(inlineModulesListPath, watchedDirectories);
    });
}
//# sourceMappingURL=mirrorKotlinInlineModulesCommand.js.map