import commander from 'commander';

import {
  AutolinkingCommonArguments,
  createAutolinkingOptionsLoader,
  registerAutolinkingArguments,
} from './autolinkingOptions';
import { findModulesAsync } from '../autolinking/findModules';
import { generateModulesProviderAsync } from '../autolinking/generatePackageList';
import { resolveModulesAsync } from '../autolinking/resolveModules';

interface GenerateModulesProviderArguments extends AutolinkingCommonArguments {
  target: string;
  entitlement?: string;
  packages?: string[] | null;
  appRoot?: string;
}

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
    .action(
      async (searchPaths: string[] | null, commandArguments: GenerateModulesProviderArguments) => {
        const platform = commandArguments.platform ?? 'apple';
        const autolinkingOptionsLoader = createAutolinkingOptionsLoader({
          ...commandArguments,
          searchPaths,
        });
        const autolinkingOptions = await autolinkingOptionsLoader.getPlatformOptions(platform);

        const expoModulesSearchResults = await findModulesAsync({
          autolinkingOptions: await autolinkingOptionsLoader.getPlatformOptions(platform),
          appRoot: commandArguments.appRoot ?? (await autolinkingOptionsLoader.getAppRoot()),
        });
        const expoModulesResolveResults = await resolveModulesAsync(
          expoModulesSearchResults,
          autolinkingOptions
        );

        const includeModules = new Set(commandArguments.packages ?? []);
        const filteredModules = expoModulesResolveResults.filter((module) =>
          includeModules.has(module.packageName)
        );

        await generateModulesProviderAsync(filteredModules, {
          platform,
          targetPath: commandArguments.target,
          entitlementPath: commandArguments.entitlement ?? null,
        });
      }
    );
}
