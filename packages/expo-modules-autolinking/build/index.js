"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = __importDefault(require("commander"));
const path_1 = __importDefault(require("path"));
const autolinking_1 = require("./autolinking");
const reactNativeConfig_1 = require("./reactNativeConfig");
function hasCoreFeatures(module) {
    return module.coreFeatures !== undefined;
}
/**
 * Registers a command that only searches for available expo modules.
 */
function registerSearchCommand(commandName, fn) {
    return commander_1.default
        .command(`${commandName} [paths...]`)
        .option('-i, --ignore-paths <ignorePaths...>', 'Paths to ignore when looking up for modules.', (value, previous) => (previous ?? []).concat(value))
        .option('-e, --exclude <exclude...>', 'Package names to exclude when looking up for modules.', (value, previous) => (previous ?? []).concat(value))
        .option('-p, --platform [platform]', 'The platform that the resulting modules must support. Available options: "apple", "android"', 'apple')
        .option('--silent', 'Silence resolution warnings')
        .addOption(new commander_1.default.Option('--project-root <projectRoot>', 'The path to the root of the project').default(process.cwd(), 'process.cwd()'))
        .option('--only-project-deps', 'For a monorepo, include only modules that are the project dependencies.', true)
        .option('--no-only-project-deps', 'Opposite of --only-project-deps', false)
        .action(async (searchPaths, providedOptions) => {
        const options = await (0, autolinking_1.mergeLinkingOptionsAsync)(searchPaths.length > 0
            ? {
                ...providedOptions,
                searchPaths,
            }
            : providedOptions);
        const searchResults = await (0, autolinking_1.findModulesAsync)(options);
        return await fn(searchResults, options);
    });
}
/**
 * Registers a command that searches for modules and then resolves them for specific platform.
 */
function registerResolveCommand(commandName, fn) {
    return registerSearchCommand(commandName, fn);
}
/**
 * Registry the `react-native-config` command.
 */
function registerReactNativeConfigCommand() {
    return commander_1.default
        .command('react-native-config [paths...]')
        .option('-p, --platform [platform]', 'The platform that the resulting modules must support. Available options: "android", "ios"', 'ios')
        .option('--transitive-linking-dependencies <transitiveLinkingDependencies...>', 'The transitive dependencies to include in autolinking. Internally used by fingerprint and only supported react-native-edge-to-edge.')
        .addOption(new commander_1.default.Option('--project-root <projectRoot>', 'The path to the root of the project').default(process.cwd(), 'process.cwd()'))
        .option('-j, --json', 'Output results in the plain JSON format.', () => true, false)
        .action(async (searchPaths, providedOptions) => {
        if (!['android', 'ios'].includes(providedOptions.platform)) {
            throw new Error(`Unsupported platform: ${providedOptions.platform}`);
        }
        const projectRoot = path_1.default.dirname(await (0, autolinking_1.getProjectPackageJsonPathAsync)(providedOptions.projectRoot));
        const linkingOptions = await (0, autolinking_1.mergeLinkingOptionsAsync)(searchPaths.length > 0
            ? {
                ...providedOptions,
                projectRoot,
                searchPaths,
            }
            : {
                ...providedOptions,
                projectRoot,
            });
        const transitiveLinkingDependencies = providedOptions.transitiveLinkingDependencies ?? [];
        const options = {
            platform: linkingOptions.platform,
            projectRoot,
            searchPaths: linkingOptions.searchPaths,
            transitiveLinkingDependencies,
        };
        const results = await (0, reactNativeConfig_1.createReactNativeConfigAsync)(options);
        if (providedOptions.json) {
            console.log(JSON.stringify(results));
        }
        else {
            console.log(require('util').inspect(results, false, null, true));
        }
    });
}
module.exports = async function (args) {
    // Searches for available expo modules.
    registerSearchCommand('search', async (results, options) => {
        if (options.json) {
            console.log(JSON.stringify(results));
        }
        else {
            console.log(require('util').inspect(results, false, null, true));
        }
    }).option('-j, --json', 'Output results in the plain JSON format.', () => true, false);
    // Checks whether there are no resolving issues in the current setup.
    registerSearchCommand('verify', (results, options) => {
        const numberOfDuplicates = (0, autolinking_1.verifySearchResults)(results, options);
        if (!numberOfDuplicates) {
            console.log('✅ Everything is fine!');
        }
    });
    // Searches for available expo modules and resolves the results for given platform.
    registerResolveCommand('resolve', async (results, options) => {
        const modules = await (0, autolinking_1.resolveModulesAsync)(results, options);
        const extraDependencies = await (0, autolinking_1.resolveExtraBuildDependenciesAsync)(options);
        const configuration = (0, autolinking_1.getConfiguration)(options);
        const coreFeatures = [
            ...modules.reduce((acc, module) => {
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
        if (options.json) {
            console.log(JSON.stringify({
                extraDependencies,
                coreFeatures,
                modules,
                ...(configuration ? { configuration } : {}),
            }));
        }
        else {
            console.log(require('util').inspect({
                extraDependencies,
                coreFeatures,
                modules,
                ...(configuration ? { configuration } : {}),
            }, false, null, true));
        }
    }).option('-j, --json', 'Output results in the plain JSON format.', () => true, false);
    // Generates a source file listing all packages to link.
    // It's deprecated for apple platforms, use `generate-modules-provider` instead.
    registerResolveCommand('generate-package-list', async (results, options) => {
        const modules = options.empty ? [] : await (0, autolinking_1.resolveModulesAsync)(results, options);
        (0, autolinking_1.generatePackageListAsync)(modules, options);
    })
        .option('-t, --target <path>', 'Path to the target file, where the package list should be written to.')
        .option('-n, --namespace <namespace>', 'Java package name under which the package list should be placed.')
        .option('--empty', 'Whether to only generate an empty list. Might be used when the user opts-out of autolinking.', false);
    // Generates a source file listing all packages to link in the runtime.
    registerResolveCommand('generate-modules-provider', async (results, options) => {
        const packages = options.packages ?? [];
        const modules = await (0, autolinking_1.resolveModulesAsync)(results, options);
        const filteredModules = modules.filter((module) => packages.includes(module.packageName));
        (0, autolinking_1.generateModulesProviderAsync)(filteredModules, options);
    })
        .option('-t, --target <path>', 'Path to the target file, where the package list should be written to.')
        .option('--entitlement <path>', 'Path to the Apple code signing entitlements file.')
        .option('-p, --packages <packages...>', 'Names of the packages to include in the generated modules provider.');
    registerReactNativeConfigCommand();
    await commander_1.default
        .version(require('expo-modules-autolinking/package.json').version)
        .description('CLI command that searches for Expo modules to autolink them.')
        .parseAsync(args, { from: 'user' });
};
//# sourceMappingURL=index.js.map