"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCommand = resolveCommand;
const autolinkingOptions_1 = require("./autolinkingOptions");
const getConfiguration_1 = require("../autolinking/getConfiguration");
const resolveModules_1 = require("../autolinking/resolveModules");
const dependencies_1 = require("../dependencies");
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
        // Resolve once via the cached linker, then derive two outputs that share its scans:
        // the Expo modules to link, and the full set of resolved native-module dependencies
        // (used to gate conditional `autolinkWhen` podspecs and surfaced as `resolvedDependencies`).
        const linker = (0, dependencies_1.makeCachedDependenciesLinker)({ projectRoot: appRoot });
        // `scanDependencyResolutionsForPlatform` resolves React Native modules via a concrete
        // platform; the `apple` umbrella isn't handled by the RN-config resolver, so map it to `ios`.
        const dependencyPlatform = platform === 'apple' ? 'ios' : platform;
        const [expoModulesSearchResults, dependencyResolutions] = await Promise.all([
            (0, dependencies_1.scanExpoModuleResolutionsForPlatform)(linker, platform),
            (0, dependencies_1.scanDependencyResolutionsForPlatform)(linker, dependencyPlatform),
        ]);
        const resolvedDependencyNames = new Set(Object.keys(dependencyResolutions));
        const resolvedDependencies = Object.fromEntries(Object.entries(dependencyResolutions)
            .filter(([, resolution]) => resolution != null)
            .map(([name, resolution]) => [
            name,
            { root: resolution.path, version: resolution.version },
        ]));
        const expoModulesResolveResults = await (0, resolveModules_1.resolveModulesAsync)(expoModulesSearchResults, autolinkingOptions, { resolvedDependencyNames, commandRoot: autolinkingOptionsLoader.getCommandRoot() });
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
        const output = {
            extraDependencies,
            coreFeatures,
            modules: expoModulesResolveResults,
            resolvedDependencies,
            ...(configuration ? { configuration } : {}),
        };
        if (commandArguments.json) {
            console.log(JSON.stringify(output));
        }
        else {
            console.log(require('util').inspect(output, false, null, true));
        }
    });
}
//# sourceMappingURL=resolveCommand.js.map