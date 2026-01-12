"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensurePrebuild = exports.maybeRunPrebuild = exports.checkPrebuild = exports.withSpinner = exports.printConfig = void 0;
const chalk_1 = __importDefault(require("chalk"));
const promises_1 = __importDefault(require("node:fs/promises"));
const path_1 = __importDefault(require("path"));
const ora_1 = __importDefault(require("ora"));
const prompts_1 = __importDefault(require("prompts"));
const commands_1 = require("./commands");
const constants_1 = require("../constants");
const isBuildConfigAndroid = (config) => {
    return 'libraryName' in config;
};
const printConfig = (config) => {
    console.log(chalk_1.default.bold('Build configuration:'));
    console.log(`- Verbose: ${config.verbose}`);
    if (isBuildConfigAndroid(config)) {
        console.log(`- Build type: ${config.buildType.charAt(0).toUpperCase() + config.buildType.slice(1)}`);
        console.log(`- Brownfield library: ${config.libraryName}`);
        console.log(`- Repositories: ${config.repositories.length > 0 ? config.repositories.join(', ') : '[]'}`);
        console.log(`- Tasks: ${config.tasks.length > 0 ? config.tasks.join(', ') : '[]'}`);
    }
    else {
        console.log(`- Artifacts directory: ${config.artifacts}`);
        console.log(`- Build type: ${config.buildType.charAt(0).toUpperCase() + config.buildType.slice(1)}`);
        console.log(`- Xcode Scheme: ${config.scheme}`);
        console.log(`- Xcode Workspace: ${config.workspace}`);
    }
    console.log('');
};
exports.printConfig = printConfig;
const withSpinner = async ({ operation, loaderMessage, successMessage, errorMessage, onError = 'error', verbose = false, }) => {
    let spinner;
    try {
        if (!verbose) {
            spinner = (0, ora_1.default)(loaderMessage).start();
        }
        const result = await operation();
        if (!verbose) {
            spinner?.succeed(successMessage);
        }
        return result;
    }
    catch (error) {
        if (!verbose) {
            onError === 'error' ? spinner?.fail(errorMessage) : spinner?.warn(errorMessage);
        }
        return constants_1.Errors.generic(error);
    }
    finally {
        if (!verbose && spinner?.isSpinning) {
            spinner?.stop();
        }
    }
};
exports.withSpinner = withSpinner;
const checkPrebuild = async (platform) => {
    const nativeProjectPath = path_1.default.join(process.cwd(), platform);
    try {
        await promises_1.default.access(nativeProjectPath);
    }
    catch (error) {
        return false;
    }
    return true;
};
exports.checkPrebuild = checkPrebuild;
const maybeRunPrebuild = async (platform) => {
    console.info(`${chalk_1.default.yellow('⚠')} Prebuild for platform: ${platform} is missing`);
    const response = await (0, prompts_1.default)({
        type: 'confirm',
        name: 'shouldRunPrebuild',
        message: 'Do you want to run the prebuild now?',
        initial: false,
    });
    if (response.shouldRunPrebuild) {
        return (0, exports.withSpinner)({
            operation: () => (0, commands_1.runCommand)('npx', ['expo', 'prebuild', '--platform', platform]),
            loaderMessage: `Running 'npx expo prebuild' for platform: ${platform}...`,
            successMessage: `Prebuild for ${platform} completed\n`,
            errorMessage: `Prebuild for ${platform} failed`,
            verbose: false,
        });
    }
    else {
        console.error(`${chalk_1.default.red('✖')} Brownfield cannot be built without prebuild`);
        return process.exit(1);
    }
};
exports.maybeRunPrebuild = maybeRunPrebuild;
const ensurePrebuild = async (platform) => {
    if (!(await (0, exports.checkPrebuild)(platform))) {
        await (0, exports.maybeRunPrebuild)(platform);
    }
};
exports.ensurePrebuild = ensurePrebuild;
