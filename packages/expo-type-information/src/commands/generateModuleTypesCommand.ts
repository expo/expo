import chalk from 'chalk';
import commander from 'commander';

import {
  addCommonOptions,
  getFileTypeInformationFromArgs,
  parseCommandArguments,
  runCommandOnWatch,
  TypeInformationCommandCommonAllArguments,
  writeStringToFileOrPrintToConsole,
} from './commandUtils';
import { generateModuleTypesFileContent } from '../typescriptGeneration';

export function generateModuleTypesCommand(cli: commander.Command) {
  return addCommonOptions(cli.command('generate-module-types')).action(
    async (options: TypeInformationCommandCommonAllArguments) => {
      const parsedArgs = await parseCommandArguments(options);
      if (!parsedArgs) {
        return;
      }
      const { realOutputPath } = parsedArgs;

      const command = async () => {
        const typeInfo = await getFileTypeInformationFromArgs(parsedArgs);
        if (!typeInfo) {
          return;
        }

        const moduleTypesFileContent = await generateModuleTypesFileContent(typeInfo);
        if (!moduleTypesFileContent) {
          console.error(chalk.red(`Couldn't generate module types file content!`));
          return;
        }
        writeStringToFileOrPrintToConsole(moduleTypesFileContent, realOutputPath);
      };
      runCommandOnWatch(parsedArgs, command);
    }
  );
}
