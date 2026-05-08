import commander from 'commander';

import {
  addCommonOptions,
  getFileTypeInformationFromArgs,
  parseCommandArguments,
  runCommandOnWatch,
  TypeInformationCommandCommonAllArguments,
} from './commandUtils';
import { generateMocks } from '../mockgen';

export function generateMocksForFileCommand(cli: commander.Command) {
  return addCommonOptions(cli.command('generate-mocks-for-file')).action(
    async (options: TypeInformationCommandCommonAllArguments) => {
      const parsedArgs = await parseCommandArguments(options);
      if (!parsedArgs) {
        return;
      }

      const command = async () => {
        const typeInfo = await getFileTypeInformationFromArgs(parsedArgs);
        if (!typeInfo) {
          return;
        }
        generateMocks([typeInfo], 'typescript');
      };
      runCommandOnWatch(parsedArgs, command);
    }
  );
}
