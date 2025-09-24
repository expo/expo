"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mirrorKotlinLocalModulesCommand = mirrorKotlinLocalModulesCommand;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const autolinkingOptions_1 = require("./autolinkingOptions");
const androidLocalModules_1 = require("../localModules/androidLocalModules");
function mirrorKotlinLocalModulesCommand(cli) {
    return (0, autolinkingOptions_1.registerAutolinkingArguments)(cli.command('mirror-kotlin-local-modules <mirrorPath> <localModulesListPath> <watchedDirsSerialized>')).action(async (mirrorPath, localModulesListPath, watchedDirsSerialized) => {
        const watchedDirs = JSON.parse(watchedDirsSerialized);
        if (!mirrorPath || !localModulesListPath) {
            throw new Error('Need to provide mirrorPath and localModulesListPath!');
        }
        if (!/.android./.test(mirrorPath) || !/.android./.test(localModulesListPath)) {
            throw new Error('Generation path is not inside any android directory!');
        }
        if (!path_1.default.isAbsolute(mirrorPath) || !path_1.default.isAbsolute(localModulesListPath)) {
            throw new Error('Need to provide the absolute path to both the local modules src mirror and generated mirror directory!');
        }
        fs_1.default.rmSync(mirrorPath, { recursive: true, force: true });
        await (0, androidLocalModules_1.createSymlinksToKotlinFiles)(mirrorPath, watchedDirs);
        await (0, androidLocalModules_1.generateLocalModulesListFile)(localModulesListPath, watchedDirs);
    });
}
//# sourceMappingURL=mirrorKotlinLocalModulesCommand.js.map