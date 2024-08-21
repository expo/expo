"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCommand = void 0;
const ConfigReader_1 = __importDefault(require("./ConfigReader"));
const Paths_1 = require("./Paths");
const Platform_1 = require("./Platform");
function mapPlatform(platform) {
    if (platform === 'android') {
        return Platform_1.Platform.Android;
    }
    else if (platform === 'ios') {
        return Platform_1.Platform.iOS;
    }
    else if (platform === 'both') {
        return Platform_1.Platform.Both;
    }
    throw new Error(`Unknown platform: ${platform}`);
}
function registerCommand(commander, commandName, fn) {
    return commander
        .command(commandName)
        .option('-c, --config <path>', 'Path to the config file.')
        .option('--platform <platform>', 'Platform for which the project should be created. Available options: `ios`, `android`, `both`.')
        .option('-p, --path <string>', 'Location where the test app will be created.')
        .action(async (providedOptions) => {
        if (providedOptions.platform) {
            providedOptions.platform = mapPlatform(providedOptions.platform);
        }
        else {
            providedOptions.platform = Platform_1.Platform.Both;
        }
        // clean temp folder if the path wasn't provided.
        providedOptions.shouldBeCleaned = !providedOptions.path;
        providedOptions.path = providedOptions.path ?? (0, Paths_1.temporaryDirectory)();
        providedOptions.configFile = ConfigReader_1.default.getFilePath(providedOptions.configFile);
        const options = providedOptions;
        const configReader = new ConfigReader_1.default(options.configFile);
        try {
            await fn(configReader.readConfigFile(), options);
        }
        catch (e) {
            console.error(e);
            process.exit(1);
        }
    });
}
exports.registerCommand = registerCommand;
//# sourceMappingURL=registerCommand.js.map