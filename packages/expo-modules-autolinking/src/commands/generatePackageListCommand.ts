import commander from 'commander';

import {
  AutolinkingCommonArguments,
  mergeLinkingOptionsAsync,
  registerAutolinkingArguments,
} from './autolinkingOptions';
import { findModulesAsync, generatePackageListAsync, resolveModulesAsync } from '../autolinking';
import type { ModuleDescriptor } from '../types';

interface GeneratePackageListArguments extends AutolinkingCommonArguments {
  target: string;
  namespace: string;
  empty: boolean;
}

/** Generates a source file listing all packages to link.
 * @privateRemarks
 * This command is deprecated for apple platforms, use `generate-modules-provider` instead.
 */
export function generatePackageListCommand() {
  return registerAutolinkingArguments(commander.command('generate-package-list [searchPaths...]'))
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
    )
    .action(
      async (searchPaths: string[] | null, commandArguments: GeneratePackageListArguments) => {
        const options = await mergeLinkingOptionsAsync({ ...commandArguments, searchPaths });
        let expoModulesResolveResults: ModuleDescriptor[] = [];
        if (!options.empty) {
          // TODO(@kitten): Replace projectRoot path
          const expoModulesSearchResults = await findModulesAsync(options);
          expoModulesResolveResults = await resolveModulesAsync(expoModulesSearchResults, options);
        }
        await generatePackageListAsync(expoModulesResolveResults, options);
      }
    );
}
