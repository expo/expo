import commander from 'commander';

import {
  AutolinkingCommonArguments,
  mergeLinkingOptionsAsync,
  registerAutolinkingArguments,
} from './autolinkingOptions';
import {
  findModulesAsync,
  getConfiguration,
  resolveExtraBuildDependenciesAsync,
  resolveModulesAsync,
} from '../autolinking';
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
export function resolveCommand() {
  return registerAutolinkingArguments(commander.command('resolve [searchPaths...]'))
    .option('-j, --json', 'Output results in the plain JSON format.', () => true, false)
    .action(async (searchPaths: string[] | null, commandArguments: ResolveArguments) => {
      const options = await mergeLinkingOptionsAsync({ ...commandArguments, searchPaths });
      // TODO(@kitten): Replace projectRoot path
      const expoModulesSearchResults = await findModulesAsync(options);
      const expoModulesResolveResults = await resolveModulesAsync(
        expoModulesSearchResults,
        options
      );
      const extraDependencies = await resolveExtraBuildDependenciesAsync(options);
      const configuration = getConfiguration(options);

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

      if (options.json) {
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
