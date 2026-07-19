import commander from 'commander';

import { generateJSXIntrinsicsFileContent } from '../typescriptGeneration';
import {
  addCommonOptions,
  getFileTypeInformationFromArgs,
  parseCommandArguments,
  runCommandOnWatch,
  TypeInformationCommandCommonAllArguments,
  writeStringToFileOrPrintToConsole,
} from './commandUtils';

export function generateJsxIntrinsics(cli: commander.Command) {
  return addCommonOptions(cli.command('generate-jsx-intrinsics'))
    .description(
      'generate a declaration file for a View, update JSX intrinsics with the View props'
    )
    .action(async (options: TypeInformationCommandCommonAllArguments) => {
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

        const jsxIntrinsicViewFileContent = await generateJSXIntrinsicsFileContent(typeInfo);
        if (!jsxIntrinsicViewFileContent) {
          console.error("Couldn't generate view types!");
          return;
        }
        writeStringToFileOrPrintToConsole(jsxIntrinsicViewFileContent, realOutputPath);
      };
      runCommandOnWatch(parsedArgs, command);
    });
}
