import commander from 'commander';
import fs from 'fs';

import {
  addCommonOptions,
  parseCommandArguments,
  runCommandOnWatch,
  TypeInformationCommandCommonAllArguments,
} from './commandUtils';
import { withPreparedSingleFile } from '../typeInformation';

export function preprocessFileCommand(cli: commander.Command) {
  return addCommonOptions(cli.command('preprocess-file')).action(
    async (options: TypeInformationCommandCommonAllArguments) => {
      const parsedArgs = await parseCommandArguments(options);
      if (!parsedArgs) {
        return;
      }
      const { realInputPaths, typeInference } = parsedArgs;

      const command = async () => {
        withPreparedSingleFile(
          {
            input: { type: 'file', inputFileAbsolutePaths: realInputPaths },
            typeInference,
          },
          async (filePath) => {
            console.log(await fs.promises.readFile(filePath, 'utf-8'));
          }
        );
      };

      runCommandOnWatch(parsedArgs, command);
    }
  );
}
