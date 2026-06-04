import type commander from 'commander';
import fs from 'fs';

import type { AutolinkingCommonArguments } from './autolinkingOptions';
import { createAutolinkingOptionsLoader, registerAutolinkingArguments } from './autolinkingOptions';
import { generateModulesProviderAsync } from '../autolinking/generatePackageList';
import { resolveModulesAsync } from '../autolinking/resolveModules';
import {
  makeCachedDependenciesLinker,
  scanDependencyResolutionsForPlatform,
  scanExpoModuleResolutionsForPlatform,
} from '../dependencies';

interface GenerateModulesProviderArguments extends AutolinkingCommonArguments {
  target: string;
  podfilePropertiesFilePath: string;
  entitlement?: string;
  packages?: string[] | null;
  appRoot?: string;
}

type PartialPodfileProperties = {
  'expo.inlineModules.watchedDirectories'?: string;
};

/** Generates a source file listing all packages to link in the runtime */
export function generateModulesProviderCommand(cli: commander.CommanderStatic) {
  return registerAutolinkingArguments(cli.command('generate-modules-provider [searchPaths...]'))
    .option(
      '-t, --target <path>',
      'Path to the target file, where the package list should be written to.'
    )
    .option('--entitlement <path>', 'Path to the Apple code signing entitlements file.')
    .option(
      '-p, --packages <packages...>',
      'Names of the packages to include in the generated modules provider.'
    )
    .option('--app-root <path>', 'Path to the app root directory.')
    .option('--podfile-properties-file-path <path>', 'Path to the Podfile properties file.')
    .action(
      async (searchPaths: string[] | null, commandArguments: GenerateModulesProviderArguments) => {
        const platform = commandArguments.platform ?? 'apple';
        const autolinkingOptionsLoader = createAutolinkingOptionsLoader({
          ...commandArguments,
          searchPaths,
        });
        const autolinkingOptions = await autolinkingOptionsLoader.getPlatformOptions(platform);

        const appRoot = commandArguments.appRoot ?? (await autolinkingOptionsLoader.getAppRoot());
        const linker = makeCachedDependenciesLinker({ projectRoot: appRoot });
        // The RN-config resolver needs a concrete platform; map the `apple` umbrella to `ios`.
        const dependencyPlatform = platform === 'apple' ? 'ios' : platform;
        const [expoModulesSearchResults, dependencyResolutions] = await Promise.all([
          scanExpoModuleResolutionsForPlatform(linker, platform),
          scanDependencyResolutionsForPlatform(linker, dependencyPlatform),
        ]);
        const resolvedDependencyNames = new Set(Object.keys(dependencyResolutions));
        const expoModulesResolveResults = await resolveModulesAsync(
          expoModulesSearchResults,
          autolinkingOptions,
          { resolvedDependencyNames, commandRoot: autolinkingOptionsLoader.getCommandRoot() }
        );

        const includeModules = new Set(commandArguments.packages ?? []);
        const filteredModules = expoModulesResolveResults.filter((module) =>
          includeModules.has(module.packageName)
        );

        const podfileProperties: PartialPodfileProperties = await fs.promises
          .readFile(commandArguments.podfilePropertiesFilePath, {
            encoding: 'utf8',
          })
          .then((file) => JSON.parse(file))
          .catch(() => ({}));

        const watchedDirectories = JSON.parse(
          podfileProperties['expo.inlineModules.watchedDirectories'] ?? '[]'
        );

        await generateModulesProviderAsync(filteredModules, {
          platform,
          targetPath: commandArguments.target,
          entitlementPath: commandArguments.entitlement ?? null,
          watchedDirectories,
          appRoot,
        });
      }
    );
}
