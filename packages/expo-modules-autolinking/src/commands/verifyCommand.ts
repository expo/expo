import commander from 'commander';

import {
  AutolinkingCommonArguments,
  createAutolinkingOptionsLoader,
  registerAutolinkingArguments,
} from './autolinkingOptions';
import { verifySearchResults } from '../autolinking';
import {
  makeCachedDependenciesLinker,
  mergeResolutionResults,
  scanDependencyResolutionsForPlatform,
} from '../dependencies';

interface VerifyArguments extends AutolinkingCommonArguments {
  verbose?: boolean | null;
  json?: boolean | null;
}

export function verifyCommand() {
  return registerAutolinkingArguments(commander.command('verify'))
    .option('-v, --verbose', 'Output all results instead of just warnings.', () => true, false)
    .option('-j, --json', 'Output results in the plain JSON format.', () => true, false)
    .option(
      '-p, --platform [platform]',
      'The platform to validate native modules for. Available options: "android", "ios", "both"',
      'both'
    )
    .action(async (commandArguments: VerifyArguments) => {
      const platforms =
        commandArguments.platform === 'both' ? ['android', 'ios'] : [commandArguments.platform!];
      const autolinkingOptionsLoader = createAutolinkingOptionsLoader(commandArguments);
      const appRoot = await autolinkingOptionsLoader.getAppRoot();
      const linker = makeCachedDependenciesLinker({ projectRoot: appRoot });
      const results = mergeResolutionResults(
        await Promise.all(
          platforms.map((platform) => scanDependencyResolutionsForPlatform(linker, platform))
        )
      );
      await verifySearchResults(results, {
        appRoot,
        verbose: !!commandArguments.verbose,
        json: !!commandArguments.json,
      });
    });
}
