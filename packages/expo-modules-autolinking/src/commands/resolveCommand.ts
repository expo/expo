import commander from 'commander';

import {
  AutolinkingCommonArguments,
  createAutolinkingOptionsLoader,
  registerAutolinkingArguments,
} from './autolinkingOptions';
import { findModulesAsync } from '../autolinking/findModules';
import { getConfiguration } from '../autolinking/getConfiguration';
import {
  resolveModulesAsync,
  resolveExtraBuildDependenciesAsync,
} from '../autolinking/resolveModules';
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

      const expoModulesSearchResults = await findModulesAsync({
        autolinkingOptions,
        appRoot,
      });

      const expoModulesResolveResults = await resolveModulesAsync(
        expoModulesSearchResults,
        autolinkingOptions
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

      if (commandArguments.json) {
        console.log(
          JSON.stringify({
            extraDependencies,
            coreFeatures,
            modules: expoModulesResolveResults,
            ...(configuration ? { configuration } : {}),
          })
        );
      } else {
        console.log(
          require('util').inspect(
            {
              extraDependencies,
              coreFeatures,
              modules: expoModulesResolveResults,
              ...(configuration ? { configuration } : {}),
            },
            false,
            null,
            true
          )
        );
      }
    });
}
