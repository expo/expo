import commander from 'commander';

import {
  AutolinkingCommonArguments,
  createAutolinkingOptionsLoader,
  registerAutolinkingArguments,
} from './autolinkingOptions';
import { findModulesAsync } from '../autolinking/findModules';

interface SearchArguments extends AutolinkingCommonArguments {
  json?: boolean | null;
}

export function searchCommand(cli: commander.CommanderStatic) {
  return registerAutolinkingArguments(cli.command('search [searchPaths...]'))
    .option('-j, --json', 'Output results in the plain JSON format.', () => true, false)
    .action(async (searchPaths: string[] | null, commandArguments: SearchArguments) => {
      const platform = commandArguments.platform ?? 'apple';
      const autolinkingOptionsLoader = createAutolinkingOptionsLoader({
        ...commandArguments,
        searchPaths,
      });

      const expoModulesSearchResults = await findModulesAsync({
        autolinkingOptions: await autolinkingOptionsLoader.getPlatformOptions(platform),
        appRoot: await autolinkingOptionsLoader.getAppRoot(),
      });

      if (commandArguments.json) {
        console.log(JSON.stringify(expoModulesSearchResults));
      } else {
        console.log(require('util').inspect(expoModulesSearchResults, false, null, true));
      }
    });
}
