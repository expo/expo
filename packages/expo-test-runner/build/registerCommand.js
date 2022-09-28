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
exports.registerCommand = void 0;
const tempy = __importStar(require("tempy"));
const ConfigReader_1 = __importDefault(require("./ConfigReader"));
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
        var _a;
        if (providedOptions.platform) {
            providedOptions.platform = mapPlatform(providedOptions.platform);
        }
        else {
            providedOptions.platform = Platform_1.Platform.Both;
        }
        // clean temp folder if the path wasn't provided.
        providedOptions.shouldBeCleaned = !providedOptions.path;
        providedOptions.path = (_a = providedOptions.path) !== null && _a !== void 0 ? _a : tempy.directory();
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