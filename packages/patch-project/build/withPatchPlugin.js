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
exports.withPatchPlugin = void 0;
const config_plugins_1 = require("expo/config-plugins");
const glob_1 = require("glob");
const path_1 = __importDefault(require("path"));
const env = __importStar(require("./env"));
const gitPatch_1 = require("./gitPatch");
const DEFAULT_PATCH_ROOT = 'cng-patches';
const DEFAULT_CHANGED_LINES_LIMIT = 300;
const withPatchPlugin = (config, props) => {
    config = createPatchPlugin('android', props)(config);
    config = createPatchPlugin('ios', props)(config);
    return config;
};
exports.withPatchPlugin = withPatchPlugin;
exports.default = exports.withPatchPlugin;
const withPatchMod = (config, { platform, props }) => {
    return (0, config_plugins_1.withFinalizedMod)(config, [
        platform,
        async (config) => {
            const projectRoot = config.modRequest.projectRoot;
            const templateChecksum = config._internal?.templateChecksum ?? '';
            const patchFilePath = await determinePatchFilePathAsync(projectRoot, platform, templateChecksum, props);
            if (patchFilePath != null) {
                const changedLines = await (0, gitPatch_1.getPatchChangedLinesAsync)(patchFilePath);
                const changedLinesLimit = props?.changedLinesLimit ?? DEFAULT_CHANGED_LINES_LIMIT;
                if (changedLines > changedLinesLimit) {
                    config_plugins_1.WarningAggregator.addWarningForPlatform(platform, 'withPatchPlugin', `The patch file "${patchFilePath}" has ${changedLines} changed lines, which exceeds the limit of ${changedLinesLimit}.`);
                }
                await (0, gitPatch_1.applyPatchAsync)(projectRoot, patchFilePath);
            }
            return config;
        },
    ]);
};
function createPatchPlugin(platform, props) {
    const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
    const pluginName = `with${platformName}PatchPlugin`;
    const withUnknown = (config) => {
        return (0, config_plugins_1.withRunOnce)(config, {
            plugin: (config) => withPatchMod(config, { platform, props }),
            name: pluginName,
        });
    };
    Object.defineProperty(withUnknown, 'name', {
        value: pluginName,
    });
    return withUnknown;
}
async function determinePatchFilePathAsync(projectRoot, platform, templateChecksum, props) {
    const patchRoot = path_1.default.join(projectRoot, props?.patchRoot ?? DEFAULT_PATCH_ROOT);
    const patchFilePath = path_1.default.join(patchRoot, `${platform}+${templateChecksum}.patch`);
    const patchFiles = await getPatchFilesAsync(patchRoot, platform);
    const patchExists = patchFiles.includes(path_1.default.basename(patchFilePath));
    if (patchFiles.length > 0 && !patchExists) {
        const firstPatchFilePath = path_1.default.join(patchRoot, patchFiles[0]);
        config_plugins_1.WarningAggregator.addWarningForPlatform(platform, 'withPatchPlugin', `Having patch files in ${patchRoot} but none matching "${patchFilePath}", using "${firstPatchFilePath}" instead.`);
    }
    else if (patchFiles.length > 1) {
        config_plugins_1.WarningAggregator.addWarningForPlatform(platform, 'withPatchPlugin', `Having multiple patch files in ${patchRoot} is not supported. Only matched patch file "${patchFilePath}" will be applied.`);
    }
    if (env.EXPO_DEBUG) {
        console.log(patchExists
            ? `[withPatchPlugin] Applying patch from ${patchFilePath}`
            : `[WithPatchPlugin] No patch found: ${patchFilePath}`);
    }
    if (!patchExists) {
        return null;
    }
    return patchFilePath;
}
async function getPatchFilesAsync(patchRoot, platform) {
    return await (0, glob_1.glob)(`${platform}*.patch`, { cwd: patchRoot });
}
//# sourceMappingURL=withPatchPlugin.js.map