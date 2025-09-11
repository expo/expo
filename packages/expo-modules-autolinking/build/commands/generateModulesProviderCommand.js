"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateModulesProviderCommand = generateModulesProviderCommand;
const autolinkingOptions_1 = require("./autolinkingOptions");
const findModules_1 = require("../autolinking/findModules");
const generatePackageList_1 = require("../autolinking/generatePackageList");
const resolveModules_1 = require("../autolinking/resolveModules");
/** Generates a source file listing all packages to link in the runtime */
function generateModulesProviderCommand(cli) {
    return (0, autolinkingOptions_1.registerAutolinkingArguments)(cli.command('generate-modules-provider [searchPaths...]'))
        .option('-t, --target <path>', 'Path to the target file, where the package list should be written to.')
        .option('--entitlement <path>', 'Path to the Apple code signing entitlements file.')
        .option('-p, --packages <packages...>', 'Names of the packages to include in the generated modules provider.')
        .action(async (searchPaths, commandArguments) => {
        const platform = commandArguments.platform ?? 'apple';
        const autolinkingOptionsLoader = (0, autolinkingOptions_1.createAutolinkingOptionsLoader)({
            ...commandArguments,
            searchPaths,
        });
        const autolinkingOptions = await autolinkingOptionsLoader.getPlatformOptions(platform);
        const expoModulesSearchResults = await (0, findModules_1.findModulesAsync)({
            autolinkingOptions: await autolinkingOptionsLoader.getPlatformOptions(platform),
            appRoot: await autolinkingOptionsLoader.getAppRoot(),
        });
        const expoModulesResolveResults = await (0, resolveModules_1.resolveModulesAsync)(expoModulesSearchResults, autolinkingOptions);
        const includeModules = new Set(commandArguments.packages ?? []);
        const filteredModules = expoModulesResolveResults.filter((module) => includeModules.has(module.packageName));
        await (0, generatePackageList_1.generateModulesProviderAsync)(filteredModules, {
            platform,
            targetPath: commandArguments.target,
            entitlementPath: commandArguments.entitlement ?? null,
        });
    });
}
//# sourceMappingURL=generateModulesProviderCommand.js.map