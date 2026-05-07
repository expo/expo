"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInlineModulesTypesCommand = generateInlineModulesTypesCommand;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const commandUtils_1 = require("./commandUtils");
const utils_1 = require("../utils");
async function getResolvedWatchedDirectoriesFromAppJson(appJsonPath) {
    try {
        const appJson = JSON.parse(await fs_1.default.promises.readFile(appJsonPath, 'utf-8'));
        const watchedDirectories = appJson?.expo?.experiments?.inlineModules?.watchedDirectories;
        if (!Array.isArray(watchedDirectories)) {
            console.error(`watchedDirectories are not defined!`);
            return null;
        }
        const rootDir = path_1.default.dirname(path_1.default.resolve(appJsonPath));
        return watchedDirectories.map((relativePath) => path_1.default.resolve(rootDir, relativePath));
    }
    catch (e) {
        console.error(`Couldn't read ${appJsonPath}.`, e);
    }
    return null;
}
async function generateInlineModulesTypesCommand(cli) {
    return cli
        .command('inline-modules-types')
        .requiredOption('-a --app-json <appJsonPathPath>', 'A path to the `app.json` where the inline.modules.watchedDirectories are defined.')
        .option('-w --watcher', 'Starts a watcher that checks for changes in inline modules files.')
        .action(async (options) => {
        const parsedArgs = (0, commandUtils_1.parseCommandArguments)(options);
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
        const generateInlineModuleTSFiles = async (filePath, dirPath) => {
            await (0, commandUtils_1.generateConciseTsFiles)({
                realInputPaths: [filePath],
                realOutputPath: dirPath,
                typeInference: parsedArgs.typeInference,
                watcher: false,
            });
        };
        const dirents = [];
        for (const dir of watchedDirectories) {
            for await (const dirent of (0, utils_1.scanFilesRecursively)(dir)) {
                if (!dirent.name.endsWith('.swift')) {
                    continue;
                }
                dirents.push(dirent);
            }
        }
        await (0, utils_1.taskAll)(dirents, async (dirent) => await generateInlineModuleTSFiles(dirent.path, dirent.parentPath));
        if (!watcher) {
            return;
        }
        const debouncedInlineModulesTsGeneration = (0, commandUtils_1.debounce)(generateInlineModuleTSFiles);
        const watchedDirectoriesWatchers = new Map();
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
            const createWatcherForDir = (dir) => {
                return fs_1.default.watch(dir, { recursive: true, encoding: 'utf-8' }, async (event, fileName) => {
                    if (!fileName) {
                        return;
                    }
                    const resolvedFilePath = path_1.default.resolve(dir, fileName);
                    if (fs_1.default.existsSync(resolvedFilePath)) {
                        debouncedInlineModulesTsGeneration(resolvedFilePath, path_1.default.dirname(resolvedFilePath));
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
        const appJsonWatcher = fs_1.default.watch(appJsonPath, 'utf-8', async (event) => {
            if (event === 'rename' && !fs_1.default.existsSync(appJsonPath)) {
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
