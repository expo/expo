import commander from 'commander';
import path from 'path';

import {
  addCommonOptions,
  getFileTypeInformationFromArgs,
  parseCommandArguments,
  runCommandOnWatch,
  TypeInformationCommandCommonAllArguments,
  writeToStableFile,
} from './commandUtils';
import { generateFullTsInterface } from '../typescriptGeneration';

export function moduleInterfaceCommand(cli: commander.Command) {
  return addCommonOptions(cli.command('module-interface'))
    .summary('Generates a full ts interface for a Swift module.')
    .description(
      'Generates a full ts interface for a Swift module. It consists of types.ts file with all types defined in the module, module.ts with the native module definition, and view.tsx for each view defined in the module, and an index.ts file which reexports some functions.'
    )
    .action(async (options: TypeInformationCommandCommonAllArguments) => {
      const parsedArgs = await parseCommandArguments(options, false);
      if (!parsedArgs) {
        return;
      }
      const { realInputPaths, realOutputPath } = parsedArgs;

      const command = async () => {
        const typeInfo = await getFileTypeInformationFromArgs(parsedArgs);
        if (!typeInfo) {
          return;
        }
        const generatedFiles = await generateFullTsInterface(typeInfo);
        if (!generatedFiles) {
          return;
        }
        const { moduleTypesFile, moduleViewsFiles, moduleNativeFile, indexFile } = generatedFiles;

        const dirName = realOutputPath ?? path.dirname(realInputPaths[0] as string);
        const writeFilePromises = [];
        for (const outputFile of [
          moduleTypesFile,
          ...moduleViewsFiles,
          moduleNativeFile,
          indexFile,
        ]) {
          const outputFilePath = path.resolve(dirName, outputFile.name);
          writeFilePromises.push(
            writeToStableFile({ filePath: outputFilePath, content: outputFile.content })
          );
        }
        await Promise.all(writeFilePromises);
      };

      runCommandOnWatch(parsedArgs, command);
    });
}
