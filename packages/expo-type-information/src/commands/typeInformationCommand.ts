import commander from 'commander';

import {
  addCommonOptions,
  getFileTypeInformationFromArgs,
  parseCommandArguments,
  runCommandOnWatch,
  TypeInformationCommandCommonAllArguments,
  writeStringToFileOrPrintToConsole,
} from './commandUtils';
import { serializeTypeInformation } from '../typeInformation';

export function typeInformationCommand(cli: commander.Command) {
  return addCommonOptions(cli.command('type-information')).action(
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

        const typeInfoSerialized = serializeTypeInformation(typeInfo);
        const typeInfoSerializedString = JSON.stringify(typeInfoSerialized, null, 2);
        writeStringToFileOrPrintToConsole(typeInfoSerializedString, parsedArgs.realOutputPath);
      };

      runCommandOnWatch(parsedArgs, command);
    }
  );
}
