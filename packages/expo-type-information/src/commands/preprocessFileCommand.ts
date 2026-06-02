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
  return addCommonOptions(cli.command('preprocess-file'))
    .description(
      'Print the preprocessed file(s) in the state right before parsing them using `sourcekitten`. It helps with checking how the `--module-path`, `--input-path`, and `--type-inference` options affect the parsed file.'
    )
    .summary(
      'Print the preprocessed file(s) in the state right before parsing them using `sourcekitten`.'
    )
    .action(async (options: TypeInformationCommandCommonAllArguments) => {
      const parsedArgs = await parseCommandArguments(options);
      if (!parsedArgs) {
        return;
      }
      const { realInputPaths, typeInference, mapUnicodeCharacters } = parsedArgs;

      const command = async () => {
        withPreparedSingleFile(
          {
            input: { type: 'file', inputFileAbsolutePaths: realInputPaths },
            typeInference,
            mapUnicodeCharacters,
          },
          async (filePath) => {
            console.log(await fs.promises.readFile(filePath, 'utf-8'));
          }
        );
      };

      runCommandOnWatch(parsedArgs, command);
    });
}
