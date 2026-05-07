import commander from 'commander';

import {
  addCommonOptions,
  generateConciseTsFiles,
  parseCommandArguments,
  runCommandOnWatch,
  TypeInformationCommandCommonAllArguments,
} from './commandUtils';

export function shortModuleInterfaceCommand(cli: commander.Command) {
  addCommonOptions(
    cli
      .command('short-module-interface')
      .summary('Creates a short ts interface, great with inline-modules.')
      .description(
        'Creates a short ts interface for an expo module. Overrites `ModuleName.generated.ts` and creates `ModuleName.ts` if not present. Can be used with inline-modules.'
      )
  ).action(async (options: TypeInformationCommandCommonAllArguments) => {
    const parsedArgs = await parseCommandArguments(options, false);
    if (!parsedArgs) return;

    const command = () => generateConciseTsFiles(parsedArgs);
    runCommandOnWatch(parsedArgs, command);
  });
}
