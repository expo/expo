import commander from 'commander';
import fs from 'fs';
import path from 'path';
import {
  debounce,
  generateConciseTsFiles,
  parseCommandArguments,
  TypeInformationCommandCommonAllArguments,
} from './commandUtils';
import { scanFilesRecursively, taskAll } from '../utils';

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

export async function generateInlineModulesTypesCommand(cli: commander.Command) {
  return cli
    .command('inline-modules-types')
    .requiredOption(
      '-a --app-json <appJsonPathPath>',
      'A path to the `app.json` where the inline.modules.watchedDirectories are defined.'
    )
    .option('-w --watcher', 'Starts a watcher that checks for changes in inline modules files.')
    .action(async (options: TypeInformationCommandCommonAllArguments) => {
      const parsedArgs = parseCommandArguments(options);
      if (!parsedArgs) {
        return;
      }

      const { appJsonPath, watcher } = parsedArgs;
      if (!appJsonPath) {
        return;
      }

      const watchedDirectories = await getResolvedWatchedDirectoriesFromAppJson(appJsonPath);
      if (!watchedDirectories) {
        return;
      }

      const generateInlineModuleTSFiles = async (filePath: string, dirPath: string) => {
        await generateConciseTsFiles({
          realInputPaths: [filePath],
          realOutputPath: dirPath,
          typeInference: parsedArgs.typeInference,
          watcher: false,
        });
      };

      const dirents = [];
      for (const dir of watchedDirectories) {
        for await (const dirent of scanFilesRecursively(dir)) {
          if (!dirent.name.endsWith('.swift')) {
            continue;
          }

          dirents.push(dirent);
        }
      }

      await taskAll(
        dirents,
        async (dirent) => await generateInlineModuleTSFiles(dirent.path, dirent.parentPath)
      );

      if (!watcher) {
        return;
      }

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
            if (!fileName) {
              return;
            }

            const resolvedFilePath = path.resolve(dir, fileName);
            if (fs.existsSync(resolvedFilePath)) {
              debouncedInlineModulesTsGeneration(resolvedFilePath, path.dirname(resolvedFilePath));
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
          for (const [_, watcher] of watchedDirectoriesWatchers) {
            watcher.close();
          }
          appJsonWatcher.close();
          return;
        }

        await setupWatchedDirectoriesWatchers();
      });
    });
}
