import commander from 'commander';

import {
  AutolinkingCommonArguments,
  mergeLinkingOptionsAsync,
  registerAutolinkingArguments,
} from './autolinkingOptions';
import { findModulesAsync } from '../autolinking';

interface SearchArguments extends AutolinkingCommonArguments {
  json?: boolean | null;
}

export function searchCommand() {
  return registerAutolinkingArguments(commander.command('search [searchPaths...]'))
    .option('-j, --json', 'Output results in the plain JSON format.', () => true, false)
    .action(async (searchPaths: string[] | null, commandArguments: SearchArguments) => {
      const options = await mergeLinkingOptionsAsync({ ...commandArguments, searchPaths });
      // TODO(@kitten): Check projectRoot path
      const expoModulesSearchResults = await findModulesAsync(options);
      if (options.json) {
        console.log(JSON.stringify(expoModulesSearchResults));
      } else {
        console.log(require('util').inspect(expoModulesSearchResults, false, null, true));
      }
    });
}
