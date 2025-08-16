import commander from 'commander';

import {
  AutolinkingCommonArguments,
  mergeLinkingOptionsAsync,
  registerAutolinkingArguments,
} from './autolinkingOptions';
import {
  findModulesAsync,
  generateModulesProviderAsync,
  resolveModulesAsync,
} from '../autolinking';

interface GenerateModulesProviderArguments extends AutolinkingCommonArguments {
  target: string;
  entitlement?: string;
  packages?: string[] | null;
}

/** Generates a source file listing all packages to link in the runtime */
export function generateModulesProviderCommand() {
  return registerAutolinkingArguments(
    commander.command('generate-modules-provider [searchPaths...]')
  )
    .option(
      '-t, --target <path>',
      'Path to the target file, where the package list should be written to.'
    )
    .option('--entitlement <path>', 'Path to the Apple code signing entitlements file.')
    .option(
      '-p, --packages <packages...>',
      'Names of the packages to include in the generated modules provider.'
    )
    .action(
      async (searchPaths: string[] | null, commandArguments: GenerateModulesProviderArguments) => {
        const options = await mergeLinkingOptionsAsync({ ...commandArguments, searchPaths });
        const expoModulesSearchResults = await findModulesAsync(options);
        const expoModulesResolveResults = await resolveModulesAsync(
          expoModulesSearchResults,
          options
        );

        const includeModules = new Set(options.packages ?? []);
        const filteredModules = expoModulesResolveResults.filter((module) =>
          includeModules.has(module.packageName)
        );

        await generateModulesProviderAsync(filteredModules, {
          ...options,
          packages: options.packages ?? [], // TODO: Remove
        });
      }
    );
}
