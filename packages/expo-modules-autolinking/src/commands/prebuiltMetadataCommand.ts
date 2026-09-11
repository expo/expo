import type commander from 'commander';

import { resolvePrebuiltMetadataAsync } from '../prebuiltMetadata';
import type { AutolinkingCommonArguments } from './autolinkingOptions';
import { createAutolinkingOptionsLoader, registerAutolinkingArguments } from './autolinkingOptions';

interface PrebuiltMetadataArguments extends AutolinkingCommonArguments {
  json?: boolean | null;
}

/** Emits the prebuilt-modules metadata document (ENG-25370). */
export function prebuiltMetadataCommand(cli: commander.CommanderStatic) {
  return registerAutolinkingArguments(cli.command('prebuilt-metadata [searchPaths...]'))
    .option('-j, --json', 'Output results in the plain JSON format.', () => true, false)
    .action(async (searchPaths: string[] | null, commandArguments: PrebuiltMetadataArguments) => {
      const optionsLoader = createAutolinkingOptionsLoader({
        ...commandArguments,
        searchPaths,
      });
      const document = await resolvePrebuiltMetadataAsync(optionsLoader);
      if (commandArguments.json) {
        console.log(JSON.stringify(document));
      } else {
        console.log(require('util').inspect(document, false, null, true));
      }
    });
}
