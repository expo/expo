import commander from 'commander';

import {
  addCommonOptions,
  getFileTypeInformationFromArgs,
  parseCommandArguments,
  runCommandOnWatch,
  TypeInformationCommandCommonAllArguments,
  writeStringToFileOrPrintToConsole,
} from './commandUtils';
import { generateViewTypesFileContent } from '../typescriptGeneration';

export function generateViewTypesCommand(cli: commander.Command) {
  return addCommonOptions(cli.command('generate-view-types')).action(
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

        const viewTypesFileContent = await generateViewTypesFileContent(typeInfo);
        if (!viewTypesFileContent) {
          console.error("Couldn't generate view types!");
          return;
        }
        writeStringToFileOrPrintToConsole(viewTypesFileContent, realOutputPath);
      };

      runCommandOnWatch(parsedArgs, command);
    }
  );
}
