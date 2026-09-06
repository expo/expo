import commander from 'commander';
import fs from 'fs';
import path from 'path';

import { TypeInferenceOption } from '../typeInformation.types';
import { scanFilesRecursively, taskAll } from '../utils';
import {
  debounce,
  generateConciseTsFiles,
  maybePrepareOutputDirectory,
  parseCommandArguments,
  TypeInformationCommandCommonAllArguments,
} from './commandUtils';

async function getResolvedWatchedDirectoriesFromAppJson(
  appJsonPath: string
): Promise<string[] | null> {
  try {
    const appJson = JSON.parse(await fs.promises.readFile(appJsonPath, 'utf-8'));
    const watchedDirectories = appJson?.expo?.experiments?.inlineModules?.watchedDirectories;

    if (!Array.isArray(watchedDirectories)) {
      console.error(`watchedDirectories are not defined!`);
      return null;
    }

    const rootDir = path.dirname(path.resolve(appJsonPath));
    return watchedDirectories.map((relativePath) => path.resolve(rootDir, relativePath));
  } catch (e) {
    console.error(`Couldn't read ${appJsonPath}.`, e);
  }
  return null;
}

type GenerateInlineModulesTSFilesOptions = {
  filePath: string;
  dirPath: string;
  compileOnlyModules: Set<string>;
  typeInference: TypeInferenceOption;
  mapUnicodeCharacters: boolean;
};

async function generateInlineModuleTSFiles({
  filePath,
  dirPath,
  typeInference,
  mapUnicodeCharacters,
  compileOnlyModules,
}: GenerateInlineModulesTSFilesOptions) {
  return await generateConciseTsFiles({
    realInputPaths: [filePath, ...compileOnlyModules],
    realOutputPath: dirPath,
    typeInference,
    watcher: false,
    mapUnicodeCharacters,
    runOnQueuePreprocessing: false,
  });
}

type InlineModulesWatcherOptions = {
  appJsonPath: string;
  typeInference: TypeInferenceOption;
  mapUnicodeCharacters: boolean;
  compileOnlyModules: Set<string>;
};

const swiftModuleDefinitionRegex = /\bfunc\s+definition\s*\(\s*\)\s*->\s*[\w.]*ModuleDefinition\b/;
async function hasSwiftModuleDefinition(absoluteFilePath: string): Promise<boolean> {
  try {
    const contents = await fs.promises.readFile(absoluteFilePath, 'utf8');
    return swiftModuleDefinitionRegex.test(contents);
  } catch {
    console.warn(`Swift inline module '${absoluteFilePath}' could not be opened.`);
    return false;
  }
}

async function fileHasModuleDeclaration(filePath: string): Promise<boolean> {
  return hasSwiftModuleDefinition(filePath);
}

async function inlineModulesWatcher({
  appJsonPath,
  typeInference,
  mapUnicodeCharacters,
  compileOnlyModules,
}: InlineModulesWatcherOptions) {
  const debouncedInlineModulesTsGeneration = debounce(generateInlineModuleTSFiles);
  const watchedDirectoriesWatchers: Map<string, fs.FSWatcher> = new Map<string, fs.FSWatcher>();

  const setupWatchedDirectoriesWatchers = async () => {
    const watchedDirectories = await getResolvedWatchedDirectoriesFromAppJson(appJsonPath);

    // Merge new watchers with old watchers.
    // Let's first find and remove the obsolete ones.
    const watchedDirsSet = new Set(watchedDirectories ?? []);
    const obsoleteWatchersKeys = [];
    for (const [key] of watchedDirectoriesWatchers) {
      if (!watchedDirsSet.has(key)) {
        obsoleteWatchersKeys.push(key);
      }
    }

    for (const key of obsoleteWatchersKeys) {
      const watcher = watchedDirectoriesWatchers.get(key);
      watcher?.close();
      watchedDirectoriesWatchers.delete(key);
    }

    // Now let's create and add new watchers
    const createWatcherForDir = (dir: string) => {
      return fs.watch(dir, { recursive: true, encoding: 'utf-8' }, async (event, fileName) => {
        if (!fileName || !fileName.endsWith('.swift')) {
          return;
        }
        const resolvedFilePath = path.resolve(dir, fileName);
        if (fs.existsSync(resolvedFilePath)) {
          if (!(await fileHasModuleDeclaration(resolvedFilePath))) {
            compileOnlyModules.add(resolvedFilePath);
            return;
          }

          debouncedInlineModulesTsGeneration({
            filePath: resolvedFilePath,
            dirPath: path.dirname(resolvedFilePath),
            typeInference,
            mapUnicodeCharacters,
            compileOnlyModules,
          });
        } else {
          compileOnlyModules.delete(resolvedFilePath);
        }
      });
    };

    for (const dir of watchedDirectories ?? []) {
      const watcher = watchedDirectoriesWatchers.get(dir);
      if (!watcher) {
        watchedDirectoriesWatchers.set(dir, createWatcherForDir(dir));
      }
    }
  };
  await setupWatchedDirectoriesWatchers();

  const appJsonWatcher = fs.watch(appJsonPath, 'utf-8', async (event) => {
    if (event === 'rename' && !fs.existsSync(appJsonPath)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const [_, watcher] of watchedDirectoriesWatchers) {
        watcher.close();
      }
      appJsonWatcher.close();
      return;
    }

    await setupWatchedDirectoriesWatchers();
  });
}

export async function inlineModulesInterfaceCommand(cli: commander.Command) {
  return cli
    .command('inline-modules-interface')
    .summary('create TypeScript interface for every Swift inline module in the project')
    .description(
      `Creates a TypeScript interface for every Swift inline module in the project. The interface consists of two files:
- **Module.generated.ts**: This is regenerated with each run of the command 
- **Module.tsx**: This one is not regenerated if you change it`
    )
    .requiredOption(
      '-a --app-json <appJsonPath>',
      'A path to the app config file where the `inline.modules.watchedDirectories` are defined.'
    )
    .option('-w --watcher', 'Starts a watcher that checks for changes in inline modules files.')
    .option(
      '-t, --type-inference <typeInference>',
      'Level of type inference: `NO_INFERENCE`, `SIMPLE_INFERENCE`, or `PREPROCESS_AND_INFERENCE`. Note that the `PREPROCESS_AND_INFERENCE` option can occasionally fail on some modules. If you encountered errors, fall back to `SIMPLE_INFERENCE` or `NO_INFERENCE`.',
      'SIMPLE_INFERENCE'
    )
    .action(async (options: TypeInformationCommandCommonAllArguments) => {
      const parsedArgs = parseCommandArguments(options);
      if (!parsedArgs) {
        return;
      }
      maybePrepareOutputDirectory(parsedArgs?.realOutputPath);

      const { appJsonPath, watcher, mapUnicodeCharacters } = parsedArgs;
      if (!appJsonPath) {
        return;
      }

      const watchedDirectories = await getResolvedWatchedDirectoriesFromAppJson(appJsonPath);
      if (!watchedDirectories) {
        return;
      }

      const inlineModulesDirents = [];
      const compileOnlyModules = new Set<string>([]);
      for (const dir of watchedDirectories) {
        for await (const dirent of scanFilesRecursively(dir)) {
          if (!dirent.name.endsWith('.swift')) {
            continue;
          }
          const resolvedFilePath = dirent.path;
          if (
            fs.existsSync(resolvedFilePath) &&
            !(await fileHasModuleDeclaration(resolvedFilePath))
          ) {
            compileOnlyModules.add(resolvedFilePath);
          } else {
            inlineModulesDirents.push(dirent);
          }
        }
      }

      await taskAll(
        inlineModulesDirents,
        async (dirent) =>
          await generateInlineModuleTSFiles({
            filePath: dirent.path,
            dirPath: dirent.parentPath,
            typeInference: parsedArgs.typeInference,
            mapUnicodeCharacters,
            compileOnlyModules,
          })
      );

      if (watcher) {
        await inlineModulesWatcher({
          appJsonPath,
          typeInference: parsedArgs.typeInference,
          mapUnicodeCharacters,
          compileOnlyModules,
        });
      }
    });
}
