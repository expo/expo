"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = __importDefault(require("commander"));
const ReactImportsPatcher_1 = require("./ReactImportsPatcher");
const autolinking_1 = require("./autolinking");
/**
 * Registers a command that only searches for available expo modules.
 */
function registerSearchCommand(commandName, fn) {
    return commander_1.default
        .command(`${commandName} [paths...]`)
        .option('-i, --ignore-paths <ignorePaths...>', 'Paths to ignore when looking up for modules.', (value, previous) => (previous ?? []).concat(value))
        .option('-e, --exclude <exclude...>', 'Package names to exclude when looking up for modules.', (value, previous) => (previous ?? []).concat(value))
        .option('-p, --platform [platform]', 'The platform that the resulting modules must support. Available options: "ios", "android"', 'ios')
        .option('--silent', 'Silence resolution warnings')
        .action(async (searchPaths, providedOptions) => {
        const options = await (0, autolinking_1.mergeLinkingOptionsAsync)({
            ...providedOptions,
            searchPaths,
        });
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
// Register for `patch-react-imports` command
function registerPatchReactImportsCommand() {
    return commander_1.default
        .command('patch-react-imports [paths...]')
        .requiredOption('--pods-root <podsRoot>', 'The path to `Pods` directory')
        .option('--dry-run', 'Only list files without writing changes to the file system')
        .action(ReactImportsPatcher_1.patchReactImportsAsync);
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
    registerSearchCommand('verify', (results) => {
        const numberOfDuplicates = (0, autolinking_1.verifySearchResults)(results);
        if (!numberOfDuplicates) {
            console.log('✅ Everything is fine!');
        }
    });
    // Searches for available expo modules and resolves the results for given platform.
    registerResolveCommand('resolve', async (results, options) => {
        const modules = await (0, autolinking_1.resolveModulesAsync)(results, options);
        if (options.json) {
            console.log(JSON.stringify({ modules }));
        }
        else {
            console.log(require('util').inspect({ modules }, false, null, true));
        }
    }).option('-j, --json', 'Output results in the plain JSON format.', () => true, false);
    // Generates a source file listing all packages to link.
    registerResolveCommand('generate-package-list', async (results, options) => {
        const modules = options.empty ? [] : await (0, autolinking_1.resolveModulesAsync)(results, options);
        (0, autolinking_1.generatePackageListAsync)(modules, options);
    })
        .option('-t, --target <path>', 'Path to the target file, where the package list should be written to.')
        .option('-n, --namespace <namespace>', 'Java package name under which the package list should be placed.')
        .option('--empty', 'Whether to only generate an empty list. Might be used when the user opts-out of autolinking.', false);
    registerPatchReactImportsCommand();
    await commander_1.default
        .version(require('expo-modules-autolinking/package.json').version)
        .description('CLI command that searches for Expo modules to autolink them.')
        .parseAsync(args, { from: 'user' });
};
//# sourceMappingURL=index.js.map