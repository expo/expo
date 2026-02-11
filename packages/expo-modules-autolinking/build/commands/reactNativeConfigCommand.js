"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactNativeConfigCommand = reactNativeConfigCommand;
const autolinkingOptions_1 = require("./autolinkingOptions");
const reactNativeConfig_1 = require("../reactNativeConfig");
/** The react-native-config command (like RN CLI linking) */
function reactNativeConfigCommand(cli) {
    return (0, autolinkingOptions_1.registerAutolinkingArguments)(cli.command('react-native-config [searchPaths...]'))
        .option('-p, --platform [platform]', 'The platform that the resulting modules must support. Available options: "android", "ios"', 'ios')
        .option('--source-dir <sourceDir>', 'The path to the native source directory')
        .option('-j, --json', 'Output results in the plain JSON format.', () => true, false)
        .action(async (searchPaths, commandArguments) => {
        // TODO(@kitten): Do we need to restrict this?
        const platform = commandArguments.platform ?? 'ios';
        if (platform !== 'android' && platform !== 'ios') {
            throw new Error(`Unsupported platform: ${platform}`);
        }
        const autolinkingOptionsLoader = (0, autolinkingOptions_1.createAutolinkingOptionsLoader)({
            ...commandArguments,
            searchPaths,
        });
        const reactNativeConfig = await (0, reactNativeConfig_1.createReactNativeConfigAsync)({
            autolinkingOptions: await autolinkingOptionsLoader.getPlatformOptions(platform),
            appRoot: await autolinkingOptionsLoader.getAppRoot(),
            // NOTE(@kitten): This is currently not validated, and assumed to be validated later
            sourceDir: commandArguments.sourceDir ?? undefined,
        });
        if (commandArguments.json) {
            console.log(JSON.stringify(reactNativeConfig));
        }
        else {
            console.log(require('util').inspect(reactNativeConfig, false, null, true));
        }
    });
}
//# sourceMappingURL=reactNativeConfigCommand.js.map