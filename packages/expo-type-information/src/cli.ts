import chalk from 'chalk';
import commander from 'commander';
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
  getGeneratedModuleTypesFileContent,
  getGeneratedViewTypesFileContent,
} from './typescriptGeneration';

export type TypeInformationCommandCommonArguments = {
  inputPath: string;
  outputPath?: string;
  typeInference?: 'NO_INFERENCE' | 'SIMPLE_INFERENCE' | 'PREPROCESS_AND_INFERENCE';
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
    );
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
  typeInfo: FileTypeInformation;
  realInputPath: string;
  realOutputPath?: string;
}

async function parseCommonArgumentsAndGetFileTypeInformation(
  options: TypeInformationCommandCommonArguments
): Promise<ParsedArguments | null> {
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

  const typeInfo = await getFileTypeInformation({
    input: { type: 'file', inputFileAbsolutePath: realInputPath },
    typeInference,
  });

  if (!typeInfo) {
    console.log(
      chalk.red(`Provided file: ${options.inputPath} couldn't be parsed for type information!`)
    );
    return null;
  }

  return { typeInfo, realOutputPath, realInputPath };
}

function writeStringToFileOrPrintToConsole(text: string, realOutputPath: string | undefined) {
  if (realOutputPath) {
    fs.writeFileSync(realOutputPath, text, { flag: 'w', encoding: 'utf-8' });
    return;
  }
  console.log(text);
}

function typeInformationCommand(cli: commander.CommanderStatic) {
  return addCommonOptions(cli.command('type-information')).action(
    async (options: TypeInformationCommandCommonArguments) => {
      const parsed = await parseCommonArgumentsAndGetFileTypeInformation(options);
      if (!parsed) return;

      const { typeInfo, realOutputPath } = parsed;
      const typeInfoSerialized = serializeTypeInformation(typeInfo);
      const typeInfoSerializedString = JSON.stringify(typeInfoSerialized, null, 2);
      writeStringToFileOrPrintToConsole(typeInfoSerializedString, realOutputPath);
    }
  );
}

function generateModuleTypesCommand(cli: commander.CommanderStatic) {
  return addCommonOptions(cli.command('generate-module-types')).action(
    async (options: TypeInformationCommandCommonArguments) => {
      const parsed = await parseCommonArgumentsAndGetFileTypeInformation(options);
      if (!parsed) return;

      const { typeInfo, realInputPath, realOutputPath } = parsed;
      const moduleTypesFileContent = await getGeneratedModuleTypesFileContent(
        realInputPath,
        typeInfo
      );
      writeStringToFileOrPrintToConsole(moduleTypesFileContent, realOutputPath);
    }
  );
}

function generateViewTypesCommand(cli: commander.CommanderStatic) {
  return addCommonOptions(cli.command('generate-view-types')).action(
    async (options: TypeInformationCommandCommonArguments) => {
      const parsed = await parseCommonArgumentsAndGetFileTypeInformation(options);
      if (!parsed) return;

      const { typeInfo, realInputPath, realOutputPath } = parsed;
      const viewTypesFileContent = await getGeneratedViewTypesFileContent(realInputPath, typeInfo);
      if (!viewTypesFileContent) {
        console.error("Couldn't generate view types!");
        return;
      }
      writeStringToFileOrPrintToConsole(viewTypesFileContent, realOutputPath);
    }
  );
}

function generateMocksForFileCommand(cli: commander.CommanderStatic) {
  return addCommonOptions(cli.command('generate-mocks-for-file')).action(
    async (options: TypeInformationCommandCommonArguments) => {
      const parsed = await parseCommonArgumentsAndGetFileTypeInformation(options);
      if (!parsed) return;

      const { typeInfo } = parsed;
      generateMocks([typeInfo], 'typescript');
    }
  );
}

function generateJsxIntrinsics(cli: commander.CommanderStatic) {
  return addCommonOptions(cli.command('generate-jsx-intrinsics')).action(
    async (options: TypeInformationCommandCommonArguments) => {
      const parsed = await parseCommonArgumentsAndGetFileTypeInformation(options);
      if (!parsed) return;

      const { typeInfo, realInputPath, realOutputPath } = parsed;
      const jsxIntrinsicViewFileContent = await getGeneratedJSXIntrinsicsViewDeclaration(
        realInputPath,
        typeInfo
      );
      if (!jsxIntrinsicViewFileContent) {
        console.error("Couldn't generate view types!");
        return;
      }
      writeStringToFileOrPrintToConsole(jsxIntrinsicViewFileContent, realOutputPath);
    }
  );
}

async function main(args: string[]) {
  const cli = commander
    .version(require('../package.json').version)
    .description('CLI commands for retrieving type information from native files.');

  typeInformationCommand(cli);
  generateModuleTypesCommand(cli);
  generateViewTypesCommand(cli);
  generateMocksForFileCommand(cli);
  generateJsxIntrinsics(cli);

  await cli.parseAsync(args, { from: 'user' });
}

main(process.argv.slice(2));
