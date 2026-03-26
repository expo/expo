"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePackageInstalled = exports.validatePrebuild = void 0;
const chalk_1 = __importDefault(require("chalk"));
const config_1 = require("expo/config");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const prompts_1 = __importDefault(require("prompts"));
const commands_1 = require("./commands");
const error_1 = __importDefault(require("./error"));
const spinner_1 = require("./spinner");
const validatePrebuild = async (platform) => {
    (0, exports.validatePackageInstalled)();
    if (!checkPrebuild(platform)) {
        console.info(`${chalk_1.default.yellow(`⚠ Prebuild for platform: ${platform} is missing`)}`);
        const response = await (0, prompts_1.default)({
            type: 'confirm',
            name: 'shouldRunPrebuild',
            message: 'Do you want to run the prebuild now?',
            initial: false,
        });
        if (response.shouldRunPrebuild) {
            await (0, spinner_1.withSpinner)({
                operation: () => (0, commands_1.runCommand)('npx', ['expo', 'prebuild', '--platform', platform]),
                loaderMessage: `Running 'npx expo prebuild' for platform: ${platform}...`,
                successMessage: `Prebuild for ${platform} completed\n`,
                errorMessage: `Prebuild for ${platform} failed`,
                verbose: false,
            });
        }
        else {
            error_1.default.handle('prebuild-cancelled');
        }
    }
};
exports.validatePrebuild = validatePrebuild;
const validatePackageInstalled = () => {
    const PACKAGE_NAME = 'expo-brownfield';
    const packageJson = (0, config_1.getPackageJson)(process.cwd());
    if (!packageJson.dependencies?.[PACKAGE_NAME] && !packageJson.devDependencies?.[PACKAGE_NAME]) {
        error_1.default.handle('package-not-installed');
        return;
    }
    const { exp: config } = (0, config_1.getConfig)(process.cwd(), { skipSDKVersionRequirement: true });
    const isBrownfieldPluginConfigured = config.plugins?.some((plugin) => Array.isArray(plugin) ? plugin[0] === PACKAGE_NAME : plugin === PACKAGE_NAME);
    if (!isBrownfieldPluginConfigured) {
        error_1.default.handle('plugin-not-configured');
    }
};
exports.validatePackageInstalled = validatePackageInstalled;
const checkPrebuild = (platform) => {
    const nativeDirectory = node_path_1.default.join(process.cwd(), platform);
    return node_fs_1.default.existsSync(nativeDirectory);
};
//# sourceMappingURL=prebuild.js.map