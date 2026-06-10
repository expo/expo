import type commander from 'commander';

import type { AutolinkingCommonArguments } from './autolinkingOptions';
import { createAutolinkingOptionsLoader, registerAutolinkingArguments } from './autolinkingOptions';
import { getConfiguration } from '../autolinking/getConfiguration';
import {
  resolveModulesAsync,
  resolveExtraBuildDependenciesAsync,
} from '../autolinking/resolveModules';
import {
  makeCachedDependenciesLinker,
  scanDependencyResolutionsForPlatform,
  scanExpoModuleResolutionsForPlatform,
} from '../dependencies';
import type {
  ModuleDescriptor,
  CommonNativeModuleDescriptor,
  ModuleDescriptorAndroid,
  ModuleDescriptorIos,
} from '../types';

function hasCoreFeatures(
  module: ModuleDescriptor
): module is ModuleDescriptorAndroid | ModuleDescriptorIos {
  return (module as CommonNativeModuleDescriptor).coreFeatures !== undefined;
}

interface ResolveArguments extends AutolinkingCommonArguments {
  json?: boolean | null;
}

/** Searches for available expo modules and resolves the results for given platform. */
export function resolveCommand(cli: commander.CommanderStatic) {
  return registerAutolinkingArguments(cli.command('resolve [searchPaths...]'))
    .option('-j, --json', 'Output results in the plain JSON format.', () => true, false)
    .action(async (searchPaths: string[] | null, commandArguments: ResolveArguments) => {
      const platform = commandArguments.platform ?? 'apple';
      const autolinkingOptionsLoader = createAutolinkingOptionsLoader({
        ...commandArguments,
        searchPaths,
      });

      const autolinkingOptions = await autolinkingOptionsLoader.getPlatformOptions(platform);
      const appRoot = await autolinkingOptionsLoader.getAppRoot();

      // Resolve once via the cached linker, then derive two outputs that share its scans:
      // the Expo modules to link, and the full set of resolved native-module dependencies
      // (used to gate conditional `autolinkWhen` podspecs and surfaced as `resolvedDependencies`).
      const linker = makeCachedDependenciesLinker({ projectRoot: appRoot });
      // `scanDependencyResolutionsForPlatform` resolves React Native modules via a concrete
      // platform; the `apple` umbrella isn't handled by the RN-config resolver, so map it to `ios`.
      const dependencyPlatform = platform === 'apple' ? 'ios' : platform;
      const [expoModulesSearchResults, dependencyResolutions] = await Promise.all([
        scanExpoModuleResolutionsForPlatform(linker, platform),
        scanDependencyResolutionsForPlatform(linker, dependencyPlatform),
      ]);
      const resolvedDependencyNames = new Set(Object.keys(dependencyResolutions));
      const resolvedDependencies = Object.fromEntries(
        Object.entries(dependencyResolutions)
          .filter(([, resolution]) => resolution != null)
          .map(([name, resolution]) => [
            name,
            { root: resolution!.path, version: resolution!.version },
          ])
      );

      const expoModulesResolveResults = await resolveModulesAsync(
        expoModulesSearchResults,
        autolinkingOptions,
        { resolvedDependencyNames, commandRoot: autolinkingOptionsLoader.getCommandRoot() }
      );

      const extraDependencies = await resolveExtraBuildDependenciesAsync({
        commandRoot: autolinkingOptionsLoader.getCommandRoot(),
        platform,
      });

      const configuration = getConfiguration({ autolinkingOptions });

      const coreFeatures = [
        ...expoModulesResolveResults.reduce<Set<string>>((acc, module) => {
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
      } else {
        console.log(require('util').inspect(output, false, null, true));
      }
    });
}
