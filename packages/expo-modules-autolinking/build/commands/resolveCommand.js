"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCommand = resolveCommand;
const autolinkingOptions_1 = require("./autolinkingOptions");
const findModules_1 = require("../autolinking/findModules");
const getConfiguration_1 = require("../autolinking/getConfiguration");
const resolveModules_1 = require("../autolinking/resolveModules");
function hasCoreFeatures(module) {
    return module.coreFeatures !== undefined;
}
/** Searches for available expo modules and resolves the results for given platform. */
function resolveCommand(cli) {
    return (0, autolinkingOptions_1.registerAutolinkingArguments)(cli.command('resolve [searchPaths...]'))
        .option('-j, --json', 'Output results in the plain JSON format.', () => true, false)
        .action(async (searchPaths, commandArguments) => {
        const platform = commandArguments.platform ?? 'apple';
        const autolinkingOptionsLoader = (0, autolinkingOptions_1.createAutolinkingOptionsLoader)({
            ...commandArguments,
            searchPaths,
        });
        const autolinkingOptions = await autolinkingOptionsLoader.getPlatformOptions(platform);
        const appRoot = await autolinkingOptionsLoader.getAppRoot();
        const expoModulesSearchResults = await (0, findModules_1.findModulesAsync)({
            autolinkingOptions,
            appRoot,
        });
        const expoModulesResolveResults = await (0, resolveModules_1.resolveModulesAsync)(expoModulesSearchResults, autolinkingOptions);
        const extraDependencies = await (0, resolveModules_1.resolveExtraBuildDependenciesAsync)({
            commandRoot: autolinkingOptionsLoader.getCommandRoot(),
            platform,
        });
        const configuration = (0, getConfiguration_1.getConfiguration)({ autolinkingOptions });
        const coreFeatures = [
            ...expoModulesResolveResults.reduce((acc, module) => {
                if (hasCoreFeatures(module)) {
                    const features = module.coreFeatures ?? [];
                    for (const feature of features) {
                        acc.add(feature);
                    }
                    return acc;
                }
                return acc;
            }, new Set()),
        ];
        if (commandArguments.json) {
            console.log(JSON.stringify({
                extraDependencies,
                coreFeatures,
                modules: expoModulesResolveResults,
                ...(configuration ? { configuration } : {}),
            }));
        }
        else {
            console.log(require('util').inspect({
                extraDependencies,
                coreFeatures,
                modules: expoModulesResolveResults,
                ...(configuration ? { configuration } : {}),
            }, false, null, true));
        }
    });
}
//# sourceMappingURL=resolveCommand.js.map