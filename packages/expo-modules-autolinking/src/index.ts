import commander from 'commander';
import path from 'path';

import {
  findModulesAsync,
  generateModulesProviderAsync,
  generatePackageListAsync,
  getConfiguration,
  getProjectPackageJsonPathAsync,
  mergeLinkingOptionsAsync,
  resolveExtraBuildDependenciesAsync,
  resolveModulesAsync,
  verifySearchResults,
} from './autolinking';
import { type RNConfigCommandOptions, createReactNativeConfigAsync } from './reactNativeConfig';
import type {
  ModuleDescriptor,
  CommonNativeModuleDescriptor,
  GenerateModulesProviderOptions,
  GenerateOptions,
  ResolveOptions,
  SearchOptions,
  SearchResults,
  ModuleDescriptorAndroid,
  ModuleDescriptorIos,
} from './types';

function hasCoreFeatures(
  module: ModuleDescriptor
): module is ModuleDescriptorAndroid | ModuleDescriptorIos {
  return (module as CommonNativeModuleDescriptor).coreFeatures !== undefined;
}

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
      const options = await mergeLinkingOptionsAsync<OptionsType>(
        searchPaths.length > 0
          ? {
              ...providedOptions,
              searchPaths,
            }
          : providedOptions
      );
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

/**
 * Registry the `react-native-config` command.
 */
function registerReactNativeConfigCommand() {
  return commander
    .command('react-native-config [paths...]')
    .option(
      '-p, --platform [platform]',
      'The platform that the resulting modules must support. Available options: "android", "ios"',
      'ios'
    )
    .option(
      '--transitive-linking-dependencies <transitiveLinkingDependencies...>',
      'The transitive dependencies to include in autolinking. Internally used by fingerprint and only supported react-native-edge-to-edge.'
    )
    .addOption(
      new commander.Option(
        '--project-root <projectRoot>',
        'The path to the root of the project'
      ).default(process.cwd(), 'process.cwd()')
    )
    .option<boolean>('-j, --json', 'Output results in the plain JSON format.', () => true, false)
    .action(async (searchPaths, providedOptions) => {
      if (!['android', 'ios'].includes(providedOptions.platform)) {
        throw new Error(`Unsupported platform: ${providedOptions.platform}`);
      }
      const projectRoot = path.dirname(
        await getProjectPackageJsonPathAsync(providedOptions.projectRoot)
      );
      const linkingOptions = await mergeLinkingOptionsAsync<SearchOptions>(
        searchPaths.length > 0
          ? {
              ...providedOptions,
              projectRoot,
              searchPaths,
            }
          : {
              ...providedOptions,
              projectRoot,
            }
      );
      const transitiveLinkingDependencies = providedOptions.transitiveLinkingDependencies ?? [];
      const options: RNConfigCommandOptions = {
        platform: linkingOptions.platform,
        projectRoot,
        searchPaths: linkingOptions.searchPaths,
        transitiveLinkingDependencies,
      };
      const results = await createReactNativeConfigAsync(options);
      if (providedOptions.json) {
        console.log(JSON.stringify(results));
      } else {
        console.log(require('util').inspect(results, false, null, true));
      }
    });
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
    const extraDependencies = await resolveExtraBuildDependenciesAsync(options);
    const configuration = getConfiguration(options);

    const coreFeatures = [
      ...modules.reduce<Set<string>>((acc, module) => {
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
      console.log(
        JSON.stringify({
          extraDependencies,
          coreFeatures,
          modules,
          ...(configuration ? { configuration } : {}),
        })
      );
    } else {
      console.log(
        require('util').inspect(
          {
            extraDependencies,
            coreFeatures,
            modules,
            ...(configuration ? { configuration } : {}),
          },
          false,
          null,
          true
        )
      );
    }
  }).option<boolean>('-j, --json', 'Output results in the plain JSON format.', () => true, false);

  // Generates a source file listing all packages to link.
  // It's deprecated for apple platforms, use `generate-modules-provider` instead.
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

      generateModulesProviderAsync(filteredModules, options);
    }
  )
    .option(
      '-t, --target <path>',
      'Path to the target file, where the package list should be written to.'
    )
    .option('--entitlement <path>', 'Path to the Apple code signing entitlements file.')
    .option(
      '-p, --packages <packages...>',
      'Names of the packages to include in the generated modules provider.'
    );

  registerReactNativeConfigCommand();

  await commander
    .version(require('expo-modules-autolinking/package.json').version)
    .description('CLI command that searches for Expo modules to autolink them.')
    .parseAsync(args, { from: 'user' });
};
