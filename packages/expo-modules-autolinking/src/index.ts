import commander from 'commander';

import { patchReactImportsAsync } from './ReactImportsPatcher';
import {
  findModulesAsync,
  resolveModulesAsync,
  verifySearchResults,
  generatePackageListAsync,
  mergeLinkingOptionsAsync,
} from './autolinking';
import { resolveExtraDependenciesAsync } from './autolinking/extraDependencies';
import {
  GenerateModulesProviderOptions,
  GenerateOptions,
  ResolveOptions,
  SearchOptions,
  SearchResults,
} from './types';

/**
 * Registers a command that only searches for available expo modules.
 */
function registerSearchCommand<OptionsType extends SearchOptions>(
  commandName: string,
  fn: (search: SearchResults, options: OptionsType) => any
) {
  return commander
    .command(`${commandName} [paths...]`)
    .option<string[] | null>(
      '-i, --ignore-paths <ignorePaths...>',
      'Paths to ignore when looking up for modules.',
      (value, previous) => (previous ?? []).concat(value)
    )
    .option<string[] | null>(
      '-e, --exclude <exclude...>',
      'Package names to exclude when looking up for modules.',
      (value, previous) => (previous ?? []).concat(value)
    )
    .option(
      '-p, --platform [platform]',
      'The platform that the resulting modules must support. Available options: "apple", "android"',
      'apple'
    )
    .option('--silent', 'Silence resolution warnings')
    .addOption(
      new commander.Option(
        '--project-root <projectRoot>',
        'The path to the root of the project'
      ).default(process.cwd(), 'process.cwd()')
    )
    .option(
      '--only-project-deps',
      'For a monorepo, include only modules that are the project dependencies.',
      true
    )
    .option('--no-only-project-deps', 'Opposite of --only-project-deps', false)
    .action(async (searchPaths, providedOptions) => {
      const options = await mergeLinkingOptionsAsync<OptionsType>({
        ...providedOptions,
        searchPaths,
      });
      const searchResults = await findModulesAsync(options);
      return await fn(searchResults, options);
    });
}

/**
 * Registers a command that searches for modules and then resolves them for specific platform.
 */
function registerResolveCommand<OptionsType extends ResolveOptions>(
  commandName: string,
  fn: (search: SearchResults, options: OptionsType) => any
) {
  return registerSearchCommand<OptionsType>(commandName, fn);
}

// Register for `patch-react-imports` command
function registerPatchReactImportsCommand() {
  return commander
    .command('patch-react-imports [paths...]')
    .requiredOption('--pods-root <podsRoot>', 'The path to `Pods` directory')
    .option('--dry-run', 'Only list files without writing changes to the file system')
    .action(patchReactImportsAsync);
}

module.exports = async function (args: string[]) {
  // Searches for available expo modules.
  registerSearchCommand<SearchOptions & { json?: boolean }>('search', async (results, options) => {
    if (options.json) {
      console.log(JSON.stringify(results));
    } else {
      console.log(require('util').inspect(results, false, null, true));
    }
  }).option<boolean>('-j, --json', 'Output results in the plain JSON format.', () => true, false);

  // Checks whether there are no resolving issues in the current setup.
  registerSearchCommand('verify', (results, options) => {
    const numberOfDuplicates = verifySearchResults(results, options);
    if (!numberOfDuplicates) {
      console.log('✅ Everything is fine!');
    }
  });

  // Searches for available expo modules and resolves the results for given platform.
  registerResolveCommand('resolve', async (results, options) => {
    const modules = await resolveModulesAsync(results, options);
    const extraDependencies = await resolveExtraDependenciesAsync(options.projectRoot);

    if (options.json) {
      console.log(JSON.stringify({ extraDependencies, modules }));
    } else {
      console.log(require('util').inspect({ extraDependencies, modules }, false, null, true));
    }
  }).option<boolean>('-j, --json', 'Output results in the plain JSON format.', () => true, false);

  // Generates a source file listing all packages to link.
  // It's deprecated, use `generate-modules-provider` instead.
  registerResolveCommand<GenerateOptions>('generate-package-list', async (results, options) => {
    const modules = options.empty ? [] : await resolveModulesAsync(results, options);
    generatePackageListAsync(modules, options);
  })
    .option(
      '-t, --target <path>',
      'Path to the target file, where the package list should be written to.'
    )
    .option(
      '-n, --namespace <namespace>',
      'Java package name under which the package list should be placed.'
    )
    .option(
      '--empty',
      'Whether to only generate an empty list. Might be used when the user opts-out of autolinking.',
      false
    );

  // Generates a source file listing all packages to link in the runtime.
  registerResolveCommand<GenerateModulesProviderOptions>(
    'generate-modules-provider',
    async (results, options) => {
      const packages = options.packages ?? [];
      const modules = await resolveModulesAsync(results, options);
      const filteredModules = modules.filter((module) => packages.includes(module.packageName));

      generatePackageListAsync(filteredModules, options);
    }
  )
    .option(
      '-t, --target <path>',
      'Path to the target file, where the package list should be written to.'
    )
    .option(
      '-p, --packages <packages...>',
      'Names of the packages to include in the generated modules provider.'
    );

  registerPatchReactImportsCommand();

  await commander
    .version(require('expo-modules-autolinking/package.json').version)
    .description('CLI command that searches for Expo modules to autolink them.')
    .parseAsync(args, { from: 'user' });
};
