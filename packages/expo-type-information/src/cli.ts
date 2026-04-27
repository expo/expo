import chalk from 'chalk';
import commander, { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';

import { generateMocks } from './mockgen';
import {
  FileTypeInformation,
  getFileTypeInformation,
  serializeTypeInformation,
  TypeInferenceOption,
} from './typeInformation';
import {
  generateFullTsInterface,
  generateJSXIntrinsicsFileContent,
  generateConciseTsInterface,
  generateModuleTypesFileContent,
  generateViewTypesFileContent,
} from './typescriptGeneration';

export type TypeInformationCommandCommonArguments = {
  inputPaths?: string[];
  modulePath?: string;
  outputPath?: string;
  typeInference?: 'NO_INFERENCE' | 'SIMPLE_INFERENCE' | 'PREPROCESS_AND_INFERENCE';
  watcher?: boolean;
};

let sourcekittenInstalled: boolean | null = null;
function isSourceKittenInstalled(): boolean {
  if (sourcekittenInstalled !== null) {
    return sourcekittenInstalled;
  }
  try {
    execSync('which sourcekitten', { stdio: 'ignore' });
    sourcekittenInstalled = true;
    return true;
  } catch (e) {
    sourcekittenInstalled = false;
    return false;
  }
}

function addCommonOptions(command: commander.Command): commander.Command {
  return command
    .option(
      '-i, --input-paths <filePaths...>',
      'Paths to Swift files for some module, glob patterns are allowed.'
    )
    .option('-m --module-path <modulePath>', 'Path to expo module root directory.')
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

const taskAll = <T, R>(inputs: T[], map: (input: T) => Promise<R>): Promise<R[]> => {
  return Promise.all(inputs.map((input) => map(input)));
};

async function runCommandOnWatch(parsedArgs: ParsedArguments, command: () => Promise<void>) {
  const debounced_command = debounce(command, 1000);
  debounced_command();
  if (!parsedArgs.watcher) return;

  await taskAll(parsedArgs.realInputPaths, async (realInputPath) => {
    for await (const _ of fs.promises.watch(realInputPath)) {
      if (!fs.existsSync(realInputPath)) return;
      debounced_command();
    }
  });
}

function getFilesForGlobPattern(globPattern: string): string[] | null {
  try {
    const normalizedPattern = globPattern.replace(/\\/g, '/');

    const matches = fs.globSync(normalizedPattern, {
      withFileTypes: true,
    });

    const resolvedPaths = matches
      .filter((entry) => entry.isFile())
      .map((entry) => path.resolve(entry.parentPath, entry.name));

    return resolvedPaths.length > 0 ? resolvedPaths : null;
  } catch (error) {
    return null;
  }
}

function sanitizeAndValidateOutputPath(rawPath: string, isFilePath: boolean = true): string | null {
  try {
    const resolvedPath = path.resolve(rawPath);

    if (fs.existsSync(resolvedPath)) {
      const pathStat = fs.statSync(resolvedPath);
      if (isFilePath && !pathStat.isFile()) {
        return null;
      }
      if (!isFilePath && !pathStat.isDirectory()) {
        return null;
      }
    } else if (isFilePath) {
      const parentDir = path.dirname(resolvedPath);
      if (!fs.existsSync(parentDir)) {
        return null;
      }
    } else {
      return null;
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

function getModuleFilePathsFromPodspec(modulePath: string): string[] | null {
  const normalizedModulePath = fs.realpathSync(modulePath).replace(/\\/g, '/');

  const podspecFiles = [...fs.globSync(`${normalizedModulePath}/ios/*.podspec`)];
  const podspecFile = podspecFiles[0];

  if (!podspecFile) {
    console.warn(`No .podspec found in ${modulePath}`);
    return [];
  }

  const podspecPath = podspecFile.toString();
  const podspecDir = path.dirname(podspecPath);
  const podspecContent = fs.readFileSync(podspecPath, 'utf8');

  const sourceFilesRegex = /\.source_files\s*=\s*(["'])(.*?)\1/;
  const match = podspecContent.match(sourceFilesRegex);

  if (!match || !match[2]) {
    console.warn(`Could not extract source_files glob from ${podspecPath}`);
    return [];
  }

  const extractedGlob = match[2];
  const absoluteGlobPattern = path.posix.join(podspecDir.replace(/\\/g, '/'), extractedGlob);

  return getFilesForGlobPattern(absoluteGlobPattern)?.filter((f) => f.endsWith('.swift')) ?? null;
}

interface ParsedArguments {
  realInputPaths: string[];
  realOutputPath?: string;
  typeInference: TypeInferenceOption;
  watcher: boolean;
}

function uniqueStrings(strings: string[]): string[] {
  return [...new Set(strings)];
}

function parseCommandArguments(
  options: TypeInformationCommandCommonArguments,
  isOutputFile: boolean = true
): ParsedArguments | null {
  let realInputPaths: string[] =
    options.inputPaths ?? [].flatMap(getFilesForGlobPattern).filter((p) => p != null);
  if (options.modulePath) {
    const modulePaths = getModuleFilePathsFromPodspec(options.modulePath) ?? [];
    realInputPaths.push(...modulePaths);
  }
  realInputPaths = uniqueStrings(realInputPaths);

  if (!realInputPaths || realInputPaths.length === 0) {
    console.error(
      `Provide valid globs to existing files or a path to a module with valid podspec.`
    );
    return null;
  }

  let realOutputPath: string | undefined = undefined;
  if (options.outputPath) {
    const validatedOutPath = sanitizeAndValidateOutputPath(options.outputPath, isOutputFile);
    if (!validatedOutPath) {
      console.error(
        `Output path ${options.outputPath} is not valid. ${isOutputFile ? 'Provide a path to an existing file, or to a file in an existing parent directory.' : 'Provide a path to an existing directory.'}`
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
  return { realInputPaths, realOutputPath, typeInference, watcher };
}

async function getFileTypeInformationFromArgs({
  realInputPaths,
  typeInference,
}: ParsedArguments): Promise<FileTypeInformation | null> {
  const typeInfo = await getFileTypeInformation({
    input: { type: 'file', inputFileAbsolutePaths: realInputPaths },
    typeInference,
  });

  if (!typeInfo) {
    console.log(
      chalk.red(`Provided files: ${realInputPaths} couldn't be parsed for type information!`)
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
      const { realOutputPath } = parsedArgs;

      const command = async () => {
        const typeInfo = await getFileTypeInformationFromArgs(parsedArgs);
        if (!typeInfo) return;

        const moduleTypesFileContent = await generateModuleTypesFileContent(typeInfo);
        if (!moduleTypesFileContent) return;
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
      const { realOutputPath } = parsedArgs;

      const command = async () => {
        const typeInfo = await getFileTypeInformationFromArgs(parsedArgs);
        if (!typeInfo) return;

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
      const { realOutputPath } = parsedArgs;

      const command = async () => {
        const typeInfo = await getFileTypeInformationFromArgs(parsedArgs);
        if (!typeInfo) return;

        const jsxIntrinsicViewFileContent = await generateJSXIntrinsicsFileContent(typeInfo);
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

function getContentHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function contentHasChanged(fileContent: string): boolean {
  const hashRegex = /^\/\/ File hash: ([a-f0-9]{64})\r?\n/;
  const match = fileContent.match(hashRegex);

  if (!match) {
    return true;
  }

  const storedHash = match[1];
  const originalContent = fileContent.slice(match[0].length);
  const calculatedHash = getContentHash(originalContent);
  return storedHash !== calculatedHash;
}

function insertFileHashComment(fileContent: string): string {
  const hashString = getContentHash(fileContent);
  return `// File hash: ${hashString}
${fileContent}`;
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
    const parsedArgs = await parseCommandArguments(options, false);
    if (!parsedArgs) return;
    const { realInputPaths, realOutputPath } = parsedArgs;

    const command = async () => {
      const typeInfo = await getFileTypeInformationFromArgs(parsedArgs);
      if (!typeInfo) return;

      const { volitileGeneratedFileContent, moduleTypescriptInterfaceFileContent } =
        await generateConciseTsInterface(typeInfo);

      const moduleName = typeInfo.moduleClasses[0]?.name ?? 'UnknownModuleName';
      const dirName = realOutputPath ?? path.dirname(realInputPaths[0] as string);

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
          writeToStableFile({
            filePath: path.resolve(dirName, `${moduleName}.tsx`),
            content: moduleTypescriptInterfaceFileContent,
          }),
        ]);
      } catch (e) {}
    };

    runCommandOnWatch(parsedArgs, command);
  });
}

async function writeToStableFile({ filePath, content }: { filePath: string; content: string }) {
  let flag = 'wx';
  if (
    fs.existsSync(filePath) &&
    !contentHasChanged(await fs.promises.readFile(filePath, 'utf-8'))
  ) {
    // Overwrite the file if it wasn't changed since the last generation
    flag = 'w';
  }
  try {
    await fs.promises.writeFile(filePath, insertFileHashComment(content), {
      flag,
      encoding: 'utf-8',
    });
  } catch (e) {
    console.error(`Error writing to file.${e}`);
  }
}

function generateTypeFiles(cli: commander.Command) {
  return addCommonOptions(cli.command('generate-type-files')).action(
    async (options: TypeInformationCommandCommonArguments) => {
      const parsedArgs = await parseCommandArguments(options, false);
      if (!parsedArgs) return;
      const { realInputPaths, realOutputPath } = parsedArgs;

      const command = async () => {
        const typeInfo = await getFileTypeInformationFromArgs(parsedArgs);
        if (!typeInfo) return;
        const generatedFiles = await generateFullTsInterface(typeInfo);
        if (!generatedFiles) return;
        const { moduleTypesFile, moduleViewsFiles, moduleNativeFile, indexFile } = generatedFiles;

        const dirName = realOutputPath ?? path.dirname(realInputPaths[0] as string);
        const writeFilePromises = [];
        for (const outputFile of [
          moduleTypesFile,
          ...moduleViewsFiles,
          moduleNativeFile,
          indexFile,
        ]) {
          if (!outputFile) {
            continue;
          }
          const outputFilePath = path.resolve(dirName, outputFile.name);
          writeFilePromises.push(
            writeToStableFile({ filePath: outputFilePath, content: outputFile.content })
          );
        }
        await Promise.all(writeFilePromises);
      };

      runCommandOnWatch(parsedArgs, command);
    }
  );
}

async function main(args: string[]) {
  if (!isSourceKittenInstalled()) {
    console.error('Sourcekitten not found! Install it like so: brew install sourcekitten');
    return;
  }
  const cli = new Command();
  cli
    .name('expo-type-information')
    .version(require('../package.json').version)
    .description('CLI commands for retrieving type information from native files.');

  generateConciseExpoModuleTSInterfaceCommand(cli);
  generateMocksForFileCommand(cli);
  generateTypeFiles(cli);

  const otherCommands = cli.command('other').description('internal or very specific commands');
  typeInformationCommand(otherCommands);
  generateModuleTypesCommand(otherCommands);
  generateViewTypesCommand(otherCommands);
  generateJsxIntrinsics(otherCommands);

  await cli.parseAsync(args, { from: 'user' });
}

main(process.argv.slice(2));
