import chalk from 'chalk';
import commander, { Command } from 'commander';
import fs from 'fs';
import path from 'path';

import { generateMocks } from './mockgen';
import {
  FileTypeInformation,
  getFileTypeInformation,
  serializeTypeInformation,
  TypeInferenceOption,
} from './typeInformation';
import {
  getGeneratedJSXIntrinsicsViewDeclaration,
  getGeneratedModuleTypescriptInterface,
  getGeneratedModuleTypesFileContent,
  getGeneratedViewTypesFileContent,
} from './typescriptGeneration';

export type TypeInformationCommandCommonArguments = {
  inputPath: string;
  outputPath?: string;
  typeInference?: 'NO_INFERENCE' | 'SIMPLE_INFERENCE' | 'PREPROCESS_AND_INFERENCE';
  watcher?: boolean;
};

function addCommonOptions(command: commander.Command): commander.Command {
  return command
    .requiredOption('-i, --input-path <filePath>', 'Path to the Swift file.')
    .option(
      '-o, --output-path <filePath>',
      'Path to save the generated output. If this option is not provided the generated output is printed to console.'
    )
    .option(
      '-t, --type-inference <typeInference>',
      'Level of type inference: NO_INFERENCE, SIMPLE_INFERENCE, or PREPROCESS_AND_INFERENCE',
      'PREPROCESS_AND_INFERENCE'
    )
    .option('-w --watcher', 'Starts a watcher that checks for changes in input-path file.');
}

/**
 * Debounce a function to only run once after a period of inactivity
 * If called while waiting, it will reset the timer
 */
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  timeout: number = 500
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, timeout);
  };
}

async function runCommandOnWatch(parsedArgs: ParsedArguments, command: () => Promise<void>) {
  const debounced_command = debounce(command, 1000);
  debounced_command();
  if (!parsedArgs.watcher) return;

  for await (const _ of fs.promises.watch(parsedArgs.realInputPath)) {
    if (!fs.existsSync(parsedArgs.realInputPath)) return;
    debounced_command();
  }
}

function sanitizeAndValidatePath(rawPath: string): string | null {
  try {
    const resolvedPath = path.resolve(rawPath);

    if (!fs.existsSync(resolvedPath)) {
      return null;
    }

    if (!fs.statSync(resolvedPath).isFile()) {
      return null;
    }

    return fs.realpathSync(resolvedPath);
  } catch (error) {
    return null;
  }
}

function sanitizeAndValidateOutputPath(rawPath: string): string | null {
  try {
    const resolvedPath = path.resolve(rawPath);

    if (fs.existsSync(resolvedPath)) {
      if (!fs.statSync(resolvedPath).isFile()) {
        return null;
      }
    } else {
      const parentDir = path.dirname(resolvedPath);
      if (!fs.existsSync(parentDir)) {
        return null;
      }
    }

    return resolvedPath;
  } catch (error) {
    return null;
  }
}

function parseInferenceOption(option?: string): TypeInferenceOption | null {
  if (!option) return TypeInferenceOption.PREPROCESS_AND_INFERENCE;
  switch (option) {
    case 'NO_INFERENCE':
      return TypeInferenceOption.NO_INFERENCE;
    case 'SIMPLE_INFERENCE':
      return TypeInferenceOption.SIMPLE_INFERENCE;
    case 'PREPROCESS_AND_INFERENCE':
      return TypeInferenceOption.PREPROCESS_AND_INFERENCE;
  }
  return null;
}

interface ParsedArguments {
  realInputPath: string;
  realOutputPath?: string;
  typeInference: TypeInferenceOption;
  watcher: boolean;
}

function parseCommandArguments(
  options: TypeInformationCommandCommonArguments
): ParsedArguments | null {
  const realInputPath = sanitizeAndValidatePath(options.inputPath);
  if (!realInputPath) {
    console.error(`Path ${options.inputPath} is not a valid path to an existing file.`);
    return null;
  }

  let realOutputPath: string | undefined = undefined;
  if (options.outputPath) {
    const validatedOutPath = sanitizeAndValidateOutputPath(options.outputPath);
    if (!validatedOutPath) {
      console.error(
        `Output path ${options.outputPath} is not valid, is a directory, or its parent directory does not exist.`
      );
      return null;
    }
    realOutputPath = validatedOutPath;
  }

  const typeInference = parseInferenceOption(options.typeInference);
  if (typeInference === null) {
    console.error(`Invalid typeInference option. ${options.typeInference}`);
    return null;
  }

  const watcher = options.watcher ?? false;
  return { realInputPath, realOutputPath, typeInference, watcher };
}

async function getFileTypeInformationFromArgs({
  realInputPath,
  typeInference,
}: ParsedArguments): Promise<FileTypeInformation | null> {
  const typeInfo = await getFileTypeInformation({
    input: { type: 'file', inputFileAbsolutePath: realInputPath },
    typeInference,
  });

  if (!typeInfo) {
    console.log(
      chalk.red(`Provided file: ${realInputPath} couldn't be parsed for type information!`)
    );
    return null;
  }
  return typeInfo;
}

function writeStringToFileOrPrintToConsole(text: string, realOutputPath: string | undefined) {
  if (realOutputPath) {
    fs.writeFileSync(realOutputPath, text, { flag: 'w', encoding: 'utf-8' });
    return;
  }
  console.log(text);
}

function typeInformationCommand(cli: commander.Command) {
  return addCommonOptions(cli.command('type-information')).action(
    async (options: TypeInformationCommandCommonArguments) => {
      const parsedArgs = await parseCommandArguments(options);
      if (!parsedArgs) return;

      const command = async () => {
        const typeInfo = await getFileTypeInformationFromArgs(parsedArgs);
        if (!typeInfo) return;

        const typeInfoSerialized = serializeTypeInformation(typeInfo);
        const typeInfoSerializedString = JSON.stringify(typeInfoSerialized, null, 2);
        writeStringToFileOrPrintToConsole(typeInfoSerializedString, parsedArgs.realOutputPath);
      };

      runCommandOnWatch(parsedArgs, command);
    }
  );
}

function generateModuleTypesCommand(cli: commander.Command) {
  return addCommonOptions(cli.command('generate-module-types')).action(
    async (options: TypeInformationCommandCommonArguments) => {
      const parsedArgs = await parseCommandArguments(options);
      if (!parsedArgs) return;
      const { realInputPath, realOutputPath } = parsedArgs;

      const command = async () => {
        const typeInfo = await getFileTypeInformationFromArgs(parsedArgs);
        if (!typeInfo) return;

        const moduleTypesFileContent = await getGeneratedModuleTypesFileContent(
          realInputPath,
          typeInfo
        );
        writeStringToFileOrPrintToConsole(moduleTypesFileContent, realOutputPath);
      };
      runCommandOnWatch(parsedArgs, command);
    }
  );
}

function generateViewTypesCommand(cli: commander.Command) {
  return addCommonOptions(cli.command('generate-view-types')).action(
    async (options: TypeInformationCommandCommonArguments) => {
      const parsedArgs = await parseCommandArguments(options);
      if (!parsedArgs) return;
      const { realInputPath, realOutputPath } = parsedArgs;

      const command = async () => {
        const typeInfo = await getFileTypeInformationFromArgs(parsedArgs);
        if (!typeInfo) return;

        const viewTypesFileContent = await getGeneratedViewTypesFileContent(
          realInputPath,
          typeInfo
        );
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

function generateMocksForFileCommand(cli: commander.Command) {
  return addCommonOptions(cli.command('generate-mocks-for-file')).action(
    async (options: TypeInformationCommandCommonArguments) => {
      const parsedArgs = await parseCommandArguments(options);
      if (!parsedArgs) return;

      const command = async () => {
        const typeInfo = await getFileTypeInformationFromArgs(parsedArgs);
        if (!typeInfo) return;
        generateMocks([typeInfo], 'typescript');
      };
      runCommandOnWatch(parsedArgs, command);
    }
  );
}

function generateJsxIntrinsics(cli: commander.Command) {
  return addCommonOptions(cli.command('generate-jsx-intrinsics')).action(
    async (options: TypeInformationCommandCommonArguments) => {
      const parsedArgs = await parseCommandArguments(options);
      if (!parsedArgs) return;
      const { realInputPath, realOutputPath } = parsedArgs;

      const command = async () => {
        const typeInfo = await getFileTypeInformationFromArgs(parsedArgs);
        if (!typeInfo) return;

        const jsxIntrinsicViewFileContent = await getGeneratedJSXIntrinsicsViewDeclaration(
          realInputPath,
          typeInfo
        );
        if (!jsxIntrinsicViewFileContent) {
          console.error("Couldn't generate view types!");
          return;
        }
        writeStringToFileOrPrintToConsole(jsxIntrinsicViewFileContent, realOutputPath);
      };
      runCommandOnWatch(parsedArgs, command);
    }
  );
}

function generateConciseExpoModuleTSInterfaceCommand(cli: commander.Command) {
  addCommonOptions(
    cli
      .command('generate-concise-ts')
      .summary('Creates concise ts interface, great with inline-modules.')
      .description(
        'Creates concise ts interface for an expo module. Overrites `ModuleName.generated.ts` and creates `ModuleName.ts` if not present. Can be used with inline-modules.'
      )
  ).action(async (options: TypeInformationCommandCommonArguments) => {
    const parsedArgs = await parseCommandArguments(options);
    if (!parsedArgs) return;
    const { realInputPath, realOutputPath } = parsedArgs;

    const command = async () => {
      const typeInfo = await getFileTypeInformationFromArgs(parsedArgs);
      if (!typeInfo) return;

      const { volitileGeneratedFileContent, moduleTypescriptInterfaceFileContent } =
        await getGeneratedModuleTypescriptInterface(realInputPath, typeInfo);

      const moduleName = typeInfo.moduleClasses[0]?.name ?? 'UnknownModuleName';
      const dirName = realOutputPath ?? path.dirname(realInputPath);

      try {
        await Promise.all([
          fs.promises.writeFile(
            path.resolve(dirName, `${moduleName}.generated.ts`),
            volitileGeneratedFileContent,
            {
              flag: 'w',
              encoding: 'utf-8',
            }
          ),
          fs.promises.writeFile(
            path.resolve(dirName, `${moduleName}.tsx`),
            moduleTypescriptInterfaceFileContent,
            {
              flag: 'wx',
              encoding: 'utf-8',
            }
          ),
        ]);
      } catch (e) {}
    };

    runCommandOnWatch(parsedArgs, command);
  });
}

async function main(args: string[]) {
  const cli = new Command();
  cli
    .name('expo-type-information')
    .version(require('../package.json').version)
    .description('CLI commands for retrieving type information from native files.');

  generateConciseExpoModuleTSInterfaceCommand(cli);
  generateMocksForFileCommand(cli);

  const otherCommands = cli.command('other').description('internal or very specific commands');
  typeInformationCommand(otherCommands);
  generateModuleTypesCommand(otherCommands);
  generateViewTypesCommand(otherCommands);
  generateJsxIntrinsics(otherCommands);

  await cli.parseAsync(args, { from: 'user' });
}

main(process.argv.slice(2));
