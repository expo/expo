import commander from "commander";
import path from "path";

import { generateFullTsInterface, OutputFile } from "../typescriptGeneration";
import {
  addCommonOptions,
  getFileTypeInformationFromArgs,
  maybePrepareOutputDirectory,
  parseCommandArguments,
  runCommandOnWatch,
  TypeInformationCommandCommonAllArguments,
  writeToStableFile,
} from "./commandUtils";

export function moduleInterfaceCommand(cli: commander.Command) {
  return addCommonOptions(cli.command("module-interface"))
    .summary("generate a full TypeScript interface for a Swift module")
    .description(
      `Generates a full TypeScript interface for a Swift module. It consists of:

- **types.ts** file with all types defined in the module
- **module.ts** with the native module definition
- **view.tsx** for each view defined in the module
- **index.ts** file which reexports some functions
`,
    )
    .action(async (options: TypeInformationCommandCommonAllArguments) => {
      const parsedArgs = await parseCommandArguments(options, false);
      if (!parsedArgs) {
        return;
      }
      maybePrepareOutputDirectory(parsedArgs.realOutputPath);
      const { realInputPaths, realOutputPath } = parsedArgs;

      const command = async () => {
        const typeInfo = await getFileTypeInformationFromArgs(parsedArgs);
        if (!typeInfo) {
          return;
        }
        const moduleInterfaceFiles = await generateFullTsInterface(typeInfo);
        const dirName =
          realOutputPath ?? path.dirname(realInputPaths[0] as string);
        const writeFilePromises = [];
        const finalIndexFile: OutputFile = {
          content: "",
          name: "index.ts",
        };
        for (const moduleGeneratedFiles of moduleInterfaceFiles.moduleInterfaces) {
          const {
            moduleTypesFile,
            moduleViewsFiles,
            moduleNativeFile,
            indexFile,
          } = moduleGeneratedFiles;

          for (const outputFile of [
            moduleTypesFile,
            ...moduleViewsFiles,
            moduleNativeFile,
          ]) {
            const outputFilePath = path.resolve(dirName, outputFile.name);
            writeFilePromises.push(
              writeToStableFile({
                filePath: outputFilePath,
                content: outputFile.content,
              }),
            );
          }
          finalIndexFile.content += indexFile.content;
        }
        const indexFilePath = path.resolve(dirName, finalIndexFile.name);
        writeFilePromises.push(
          writeToStableFile({
            filePath: indexFilePath,
            content: finalIndexFile.content,
          }),
        );
        const commonInterface = moduleInterfaceFiles.commonTypesInterface;
        if (commonInterface) {
          const filePath = path.resolve(dirName, commonInterface.name);
          writeFilePromises.push(
            writeToStableFile({ filePath, content: commonInterface.content }),
          );
        }
        await Promise.all(writeFilePromises);
      };

      runCommandOnWatch(parsedArgs, command);
    });
}
