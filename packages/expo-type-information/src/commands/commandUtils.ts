import chalk from 'chalk';
import { execSync } from 'child_process';
import commander from 'commander';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

import {
  FileTypeInformation,
  getFileTypeInformation,
  TypeInferenceOption,
} from '../typeInformation';
import { generateConciseTsInterface } from '../typescriptGeneration';
import { taskAll } from '../utils';

export type TypeInformationCommandCommonAllArguments = {
  inputPaths?: string[];
  modulePath?: string;
  outputPath?: string;
  typeInference?: 'NO_INFERENCE' | 'SIMPLE_INFERENCE' | 'PREPROCESS_AND_INFERENCE';
  watcher?: boolean;
  appJson?: string;
};

let sourcekittenInstalled: boolean;
export function isSourceKittenInstalled(): boolean {
  if (sourcekittenInstalled !== undefined) {
    return sourcekittenInstalled;
  }
  try {
    execSync('which sourcekitten', { stdio: 'ignore' });
    sourcekittenInstalled = true;
  } catch {
    sourcekittenInstalled = false;
  }
  return sourcekittenInstalled;
}

export interface ParsedArguments {
  realInputPaths: string[];
  realOutputPath?: string;
  typeInference: TypeInferenceOption;
  watcher: boolean;
  appJsonPath?: string;
}

export function addCommonOptions(command: commander.Command): commander.Command {
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
      // TODO(@HubertBer) Fix the PREPROCESS_AND_INFERENCE option.
      'Level of type inference: NO_INFERENCE, SIMPLE_INFERENCE, or PREPROCESS_AND_INFERENCE. Note that the last option rarely fails for some modules, use the 2nd or 1st in that case.',
      'SIMPLE_INFERENCE'
    )
    .option('-w --watcher', 'Starts a watcher that checks for changes in input-path file.');
}

/**
 * Debounce a function to only run once after a period of inactivity
 * If called while waiting, it will reset the timer
 */
export function debounce<T extends (...args: any[]) => any>(
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

export async function runCommandOnWatch(parsedArgs: ParsedArguments, command: () => Promise<void>) {
  const debounced_command = debounce(command, 1000);
  debounced_command();
  if (!parsedArgs.watcher) {
    return;
  }

  await taskAll(parsedArgs.realInputPaths, async (realInputPath) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of fs.promises.watch(realInputPath)) {
      if (!fs.existsSync(realInputPath)) {
        return;
      }
      debounced_command();
    }
  });
}

export function getFilesForGlobPattern(globPattern: string): string[] | null {
  try {
    const normalizedPattern = globPattern.replace(/\\/g, '/');

    const matches = fs.globSync(normalizedPattern, {
      withFileTypes: true,
    });

    const resolvedPaths = matches
      .filter((entry) => entry.isFile())
      .map((entry) => path.resolve(entry.parentPath, entry.name));

    return resolvedPaths.length > 0 ? resolvedPaths : null;
  } catch {
    return null;
  }
}

export function sanitizeAndValidateOutputPath(
  rawPath: string,
  isFilePath: boolean = true
): string | null {
  try {
    const resolvedPath = path.resolve(rawPath);

    if (fs.existsSync(resolvedPath)) {
      const pathStat = fs.statSync(resolvedPath);
      const isValid = isFilePath ? pathStat.isFile() : pathStat.isDirectory();
      return isValid ? resolvedPath : null;
    }

    if (isFilePath && fs.existsSync(path.dirname(resolvedPath))) {
      return resolvedPath;
    }
  } catch {}

  return null;
}

export function parseInferenceOption(option?: string): TypeInferenceOption | null {
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

export function getPodspecFilePath(modulePath: string): string | null {
  const normalizedModulePath = fs.realpathSync(modulePath).replace(/\\/g, '/');

  const podspecFiles = [...fs.globSync(`${normalizedModulePath}/ios/*.podspec`)];
  const podspecFile = podspecFiles[0];
  return podspecFile ?? null;
}

export function getSourceFilesGlobFromPodspecFile(podspecPath: string): string | null {
  const podspecContent = fs.readFileSync(podspecPath, 'utf8');
  const sourceFilesRegex = /\.source_files\s*=\s*(["'])(.*?)\1/;
  const match = podspecContent.match(sourceFilesRegex);
  return match?.[2] ?? null;
}

export function getModuleFilePathsFromPodspec(modulePath: string): string[] | null {
  const podspecPath = getPodspecFilePath(modulePath);
  if (!podspecPath) {
    console.warn(`No .podspec found in ${modulePath}`);
    return null;
  }

  const extractedGlob = getSourceFilesGlobFromPodspecFile(podspecPath);
  if (!extractedGlob) {
    console.warn(`Could not extract source_files glob from ${podspecPath}`);
    return null;
  }

  const podspecDir = path.dirname(podspecPath);
  const absoluteGlobPattern = path.posix.join(podspecDir.replace(/\\/g, '/'), extractedGlob);

  return getFilesForGlobPattern(absoluteGlobPattern)?.filter((f) => f.endsWith('.swift')) ?? null;
}

export function uniqueStrings(strings: string[]): string[] {
  return [...new Set(strings)];
}

export function parseCommandArguments(
  options: TypeInformationCommandCommonAllArguments,
  isOutputFile: boolean = true
): ParsedArguments | null {
  const appJsonPath = options.appJson ?? undefined;
  let realInputPaths: string[] = (options.inputPaths ?? [])
    .flatMap(getFilesForGlobPattern)
    .filter((p) => p != null);

  if (options.modulePath) {
    const modulePaths = getModuleFilePathsFromPodspec(options.modulePath) ?? [];
    realInputPaths.push(...modulePaths);
  }
  realInputPaths = uniqueStrings(realInputPaths);

  if ((!realInputPaths || realInputPaths.length === 0) && !appJsonPath) {
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
  } else if (options.modulePath) {
    // if path to module directory is provided, we can generate ts types under src directory
    realOutputPath =
      sanitizeAndValidateOutputPath(path.join(options.modulePath, 'src'), false) ?? undefined;
  }

  const typeInference = parseInferenceOption(options.typeInference);
  if (typeInference === null) {
    console.error(`Invalid typeInference option. ${options.typeInference}`);
    return null;
  }

  const watcher = options.watcher ?? false;
  return { realInputPaths, realOutputPath, typeInference, watcher, appJsonPath };
}

export async function getFileTypeInformationFromArgs({
  realInputPaths,
  typeInference,
}: {
  realInputPaths: string[];
  typeInference: TypeInferenceOption;
}): Promise<FileTypeInformation | null> {
  const typeInfo = await getFileTypeInformation({
    input: { type: 'file', inputFileAbsolutePaths: realInputPaths },
    typeInference,
  });

  if (!typeInfo) {
    console.error(
      chalk.red(`Provided files: ${realInputPaths} couldn't be parsed for type information!`)
    );
    return null;
  }
  return typeInfo;
}

export function writeStringToFileOrPrintToConsole(
  text: string,
  realOutputPath: string | undefined
) {
  if (realOutputPath) {
    fs.writeFileSync(realOutputPath, text, { flag: 'w', encoding: 'utf-8' });
    return;
  }
  console.log(text);
}

export function getContentHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

export function contentHasChanged(fileContent: string): boolean {
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

export function insertFileHashComment(fileContent: string): string {
  const hashString = getContentHash(fileContent);
  return `// File hash: ${hashString}
${fileContent}`;
}

export async function writeToStableFile({
  filePath,
  content,
}: {
  filePath: string;
  content: string;
}) {
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
    console.error('Error writing to a file.', e);
  }
}

export async function generateConciseTsFiles(parsedArgs: ParsedArguments) {
  const { realInputPaths, realOutputPath } = parsedArgs;
  const typeInfo = await getFileTypeInformationFromArgs(parsedArgs);
  if (!typeInfo) {
    return;
  }

  const { volatileGeneratedFileContent, moduleTypescriptInterfaceFileContent } =
    await generateConciseTsInterface(typeInfo);

  const moduleName = typeInfo.moduleClasses[0]?.name ?? 'UnknownModuleName';
  const dirName = realOutputPath ?? path.dirname(realInputPaths[0] as string);

  try {
    await Promise.all([
      fs.promises.writeFile(
        path.resolve(dirName, `${moduleName}.generated.ts`),
        volatileGeneratedFileContent,
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
  } catch (e) {
    console.error(`Error writing to a file.`, e);
  }
}
