"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePackageListCommand = generatePackageListCommand;
const autolinkingOptions_1 = require("./autolinkingOptions");
const findModules_1 = require("../autolinking/findModules");
const generatePackageList_1 = require("../autolinking/generatePackageList");
const resolveModules_1 = require("../autolinking/resolveModules");
/** Generates a source file listing all packages to link.
 * @privateRemarks
 * This command is deprecated for apple platforms, use `generate-modules-provider` instead.
 */
function generatePackageListCommand(cli) {
    return (0, autolinkingOptions_1.registerAutolinkingArguments)(cli.command('generate-package-list [searchPaths...]'))
        .option('-t, --target <path>', 'Path to the target file, where the package list should be written to.')
        .option('-n, --namespace <namespace>', 'Java package name under which the package list should be placed.')
        .option('--empty', 'Whether to only generate an empty list. Might be used when the user opts-out of autolinking.', false)
        .action(async (searchPaths, commandArguments) => {
        const platform = commandArguments.platform ?? 'android';
        const autolinkingOptionsLoader = (0, autolinkingOptions_1.createAutolinkingOptionsLoader)({
            ...commandArguments,
            searchPaths,
        });
        let expoModulesResolveResults = [];
        if (!commandArguments.empty) {
            const autolinkingOptions = await autolinkingOptionsLoader.getPlatformOptions(platform);
            const expoModulesSearchResults = await (0, findModules_1.findModulesAsync)({
                autolinkingOptions: await autolinkingOptionsLoader.getPlatformOptions(platform),
                appRoot: await autolinkingOptionsLoader.getAppRoot(),
            });
            expoModulesResolveResults = await (0, resolveModules_1.resolveModulesAsync)(expoModulesSearchResults, autolinkingOptions);
        }
        await (0, generatePackageList_1.generatePackageListAsync)(expoModulesResolveResults, {
            platform,
            targetPath: commandArguments.target,
            namespace: commandArguments.namespace,
        });
    });
}
//# sourceMappingURL=generatePackageListCommand.js.map