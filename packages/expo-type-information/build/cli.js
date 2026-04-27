"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = require("commander");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const node_child_process_1 = require("node:child_process");
const node_crypto_1 = require("node:crypto");
const mockgen_1 = require("./mockgen");
const typeInformation_1 = require("./typeInformation");
const typescriptGeneration_1 = require("./typescriptGeneration");
const utils_1 = require("./utils");
let sourcekittenInstalled = null;
function isSourceKittenInstalled() {
    if (sourcekittenInstalled !== null) {
        return sourcekittenInstalled;
    }
    try {
        (0, node_child_process_1.execSync)('which sourcekitten', { stdio: 'ignore' });
        sourcekittenInstalled = true;
        return true;
    }
    catch (e) {
        sourcekittenInstalled = false;
        return false;
    }
}
function addCommonOptions(command) {
    return command
        .option('-i, --input-paths <filePaths...>', 'Paths to Swift files for some module, glob patterns are allowed.')
        .option('-m --module-path <modulePath>', 'Path to expo module root directory.')
        .option('-o, --output-path <filePath>', 'Path to save the generated output. If this option is not provided the generated output is printed to console.')
        .option('-t, --type-inference <typeInference>', 
    // TODO(@HubertBer) Fix the PREPROCESS_AND_INFERENCE option.
    'Level of type inference: NO_INFERENCE, SIMPLE_INFERENCE, or PREPROCESS_AND_INFERENCE. Note that the last option rarely fails for some modules, use the 2nd or 1st in that case.', 'SIMPLE_INFERENCE')
        .option('-w --watcher', 'Starts a watcher that checks for changes in input-path file.');
}
/**
 * Debounce a function to only run once after a period of inactivity
 * If called while waiting, it will reset the timer
 */
function debounce(fn, timeout = 500) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            fn(...args);
        }, timeout);
    };
}
const taskAll = (inputs, map) => {
    return Promise.all(inputs.map((input) => map(input)));
};
async function runCommandOnWatch(parsedArgs, command) {
    const debounced_command = debounce(command, 1000);
    debounced_command();
    if (!parsedArgs.watcher)
        return;
    await taskAll(parsedArgs.realInputPaths, async (realInputPath) => {
        for await (const _ of fs_1.default.promises.watch(realInputPath)) {
            if (!fs_1.default.existsSync(realInputPath))
                return;
            debounced_command();
        }
    });
}
function getFilesForGlobPattern(globPattern) {
    try {
        const normalizedPattern = globPattern.replace(/\\/g, '/');
        const matches = fs_1.default.globSync(normalizedPattern, {
            withFileTypes: true,
        });
        const resolvedPaths = matches
            .filter((entry) => entry.isFile())
            .map((entry) => path_1.default.resolve(entry.parentPath, entry.name));
        return resolvedPaths.length > 0 ? resolvedPaths : null;
    }
    catch (error) {
        return null;
    }
}
function sanitizeAndValidateOutputPath(rawPath, isFilePath = true) {
    try {
        const resolvedPath = path_1.default.resolve(rawPath);
        if (fs_1.default.existsSync(resolvedPath)) {
            const pathStat = fs_1.default.statSync(resolvedPath);
            if (isFilePath && !pathStat.isFile()) {
                console.log('1');
                return null;
            }
            if (!isFilePath && !pathStat.isDirectory()) {
                console.log('2');
                return null;
            }
        }
        else if (isFilePath) {
            const parentDir = path_1.default.dirname(resolvedPath);
            if (!fs_1.default.existsSync(parentDir)) {
                console.log('3');
                return null;
            }
        }
        else {
            console.log('4');
            return null;
        }
        return resolvedPath;
    }
    catch (error) {
        console.log('5');
        return null;
    }
}
function parseInferenceOption(option) {
    if (!option)
        return typeInformation_1.TypeInferenceOption.PREPROCESS_AND_INFERENCE;
    switch (option) {
        case 'NO_INFERENCE':
            return typeInformation_1.TypeInferenceOption.NO_INFERENCE;
        case 'SIMPLE_INFERENCE':
            return typeInformation_1.TypeInferenceOption.SIMPLE_INFERENCE;
        case 'PREPROCESS_AND_INFERENCE':
            return typeInformation_1.TypeInferenceOption.PREPROCESS_AND_INFERENCE;
    }
    return null;
}
function getModuleFilePathsFromPodspec(modulePath) {
    const normalizedModulePath = fs_1.default.realpathSync(modulePath).replace(/\\/g, '/');
    const podspecFiles = [...fs_1.default.globSync(`${normalizedModulePath}/ios/*.podspec`)];
    const podspecFile = podspecFiles[0];
    if (!podspecFile) {
        console.warn(`No .podspec found in ${modulePath}`);
        return [];
    }
    const podspecPath = podspecFile.toString();
    const podspecDir = path_1.default.dirname(podspecPath);
    const podspecContent = fs_1.default.readFileSync(podspecPath, 'utf8');
    const sourceFilesRegex = /\.source_files\s*=\s*(["'])(.*?)\1/;
    const match = podspecContent.match(sourceFilesRegex);
    if (!match || !match[2]) {
        console.warn(`Could not extract source_files glob from ${podspecPath}`);
        return [];
    }
    const extractedGlob = match[2];
    const absoluteGlobPattern = path_1.default.posix.join(podspecDir.replace(/\\/g, '/'), extractedGlob);
    return getFilesForGlobPattern(absoluteGlobPattern)?.filter((f) => f.endsWith('.swift')) ?? null;
}
function uniqueStrings(strings) {
    return [...new Set(strings)];
}
function parseCommandArguments(options, isOutputFile = true) {
    const appJsonPath = options.appJson ?? undefined;
    let realInputPaths = options.inputPaths ?? [].flatMap(getFilesForGlobPattern).filter((p) => p != null);
    if (options.modulePath) {
        const modulePaths = getModuleFilePathsFromPodspec(options.modulePath) ?? [];
        realInputPaths.push(...modulePaths);
    }
    realInputPaths = uniqueStrings(realInputPaths);
    if ((!realInputPaths || realInputPaths.length === 0) && !appJsonPath) {
        console.error(`Provide valid globs to existing files or a path to a module with valid podspec.`);
        return null;
    }
    let realOutputPath = undefined;
    if (options.outputPath) {
        const validatedOutPath = sanitizeAndValidateOutputPath(options.outputPath, isOutputFile);
        if (!validatedOutPath) {
            console.error(`Output path ${options.outputPath} is not valid. ${isOutputFile ? 'Provide a path to an existing file, or to a file in an existing parent directory.' : 'Provide a path to an existing directory.'}`);
            return null;
        }
        realOutputPath = validatedOutPath;
    }
    else if (options.modulePath) {
        // if path to module directory is provided, we can generate ts types under src directory
        realOutputPath =
            sanitizeAndValidateOutputPath(path_1.default.join(options.modulePath, 'src'), false) ?? undefined;
    }
    const typeInference = parseInferenceOption(options.typeInference);
    if (typeInference === null) {
        console.error(`Invalid typeInference option. ${options.typeInference}`);
        return null;
    }
    const watcher = options.watcher ?? false;
    return { realInputPaths, realOutputPath, typeInference, watcher, appJsonPath };
}
async function getFileTypeInformationFromArgs({ realInputPaths, typeInference, }) {
    const typeInfo = await (0, typeInformation_1.getFileTypeInformation)({
        input: { type: 'file', inputFileAbsolutePaths: realInputPaths },
        typeInference,
    });
    if (!typeInfo) {
        console.log(chalk_1.default.red(`Provided files: ${realInputPaths} couldn't be parsed for type information!`));
        return null;
    }
    return typeInfo;
}
function writeStringToFileOrPrintToConsole(text, realOutputPath) {
    if (realOutputPath) {
        fs_1.default.writeFileSync(realOutputPath, text, { flag: 'w', encoding: 'utf-8' });
        return;
    }
    console.log(text);
}
function typeInformationCommand(cli) {
    return addCommonOptions(cli.command('type-information')).action(async (options) => {
        const parsedArgs = await parseCommandArguments(options);
        if (!parsedArgs)
            return;
        const command = async () => {
            const typeInfo = await getFileTypeInformationFromArgs(parsedArgs);
            if (!typeInfo)
                return;
            const typeInfoSerialized = (0, typeInformation_1.serializeTypeInformation)(typeInfo);
            const typeInfoSerializedString = JSON.stringify(typeInfoSerialized, null, 2);
            writeStringToFileOrPrintToConsole(typeInfoSerializedString, parsedArgs.realOutputPath);
        };
        runCommandOnWatch(parsedArgs, command);
    });
}
function generateModuleTypesCommand(cli) {
    return addCommonOptions(cli.command('generate-module-types')).action(async (options) => {
        const parsedArgs = await parseCommandArguments(options);
        if (!parsedArgs)
            return;
        const { realOutputPath } = parsedArgs;
        const command = async () => {
            const typeInfo = await getFileTypeInformationFromArgs(parsedArgs);
            if (!typeInfo)
                return;
            const moduleTypesFileContent = await (0, typescriptGeneration_1.generateModuleTypesFileContent)(typeInfo);
            if (!moduleTypesFileContent)
                return;
            writeStringToFileOrPrintToConsole(moduleTypesFileContent, realOutputPath);
        };
        runCommandOnWatch(parsedArgs, command);
    });
}
function generateViewTypesCommand(cli) {
    return addCommonOptions(cli.command('generate-view-types')).action(async (options) => {
        const parsedArgs = await parseCommandArguments(options);
        if (!parsedArgs)
            return;
        const { realOutputPath } = parsedArgs;
        const command = async () => {
            const typeInfo = await getFileTypeInformationFromArgs(parsedArgs);
            if (!typeInfo)
                return;
            const viewTypesFileContent = await (0, typescriptGeneration_1.generateViewTypesFileContent)(typeInfo);
            if (!viewTypesFileContent) {
                console.error("Couldn't generate view types!");
                return;
            }
            writeStringToFileOrPrintToConsole(viewTypesFileContent, realOutputPath);
        };
        runCommandOnWatch(parsedArgs, command);
    });
}
function generateMocksForFileCommand(cli) {
    return addCommonOptions(cli.command('generate-mocks-for-file')).action(async (options) => {
        const parsedArgs = await parseCommandArguments(options);
        if (!parsedArgs)
            return;
        const command = async () => {
            const typeInfo = await getFileTypeInformationFromArgs(parsedArgs);
            if (!typeInfo)
                return;
            (0, mockgen_1.generateMocks)([typeInfo], 'typescript');
        };
        runCommandOnWatch(parsedArgs, command);
    });
}
function generateJsxIntrinsics(cli) {
    return addCommonOptions(cli.command('generate-jsx-intrinsics')).action(async (options) => {
        const parsedArgs = await parseCommandArguments(options);
        if (!parsedArgs)
            return;
        const { realOutputPath } = parsedArgs;
        const command = async () => {
            const typeInfo = await getFileTypeInformationFromArgs(parsedArgs);
            if (!typeInfo)
                return;
            const jsxIntrinsicViewFileContent = await (0, typescriptGeneration_1.generateJSXIntrinsicsFileContent)(typeInfo);
            if (!jsxIntrinsicViewFileContent) {
                console.error("Couldn't generate view types!");
                return;
            }
            writeStringToFileOrPrintToConsole(jsxIntrinsicViewFileContent, realOutputPath);
        };
        runCommandOnWatch(parsedArgs, command);
    });
}
function getContentHash(content) {
    return (0, node_crypto_1.createHash)('sha256').update(content).digest('hex');
}
function contentHasChanged(fileContent) {
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
function insertFileHashComment(fileContent) {
    const hashString = getContentHash(fileContent);
    return `// File hash: ${hashString}
${fileContent}`;
}
async function generateConciseTsFiles(parsedArgs) {
    const { realInputPaths, realOutputPath } = parsedArgs;
    const typeInfo = await getFileTypeInformationFromArgs(parsedArgs);
    if (!typeInfo)
        return;
    const { volitileGeneratedFileContent, moduleTypescriptInterfaceFileContent } = await (0, typescriptGeneration_1.generateConciseTsInterface)(typeInfo);
    const moduleName = typeInfo.moduleClasses[0]?.name ?? 'UnknownModuleName';
    const dirName = realOutputPath ?? path_1.default.dirname(realInputPaths[0]);
    try {
        await Promise.all([
            fs_1.default.promises.writeFile(path_1.default.resolve(dirName, `${moduleName}.generated.ts`), volitileGeneratedFileContent, {
                flag: 'w',
                encoding: 'utf-8',
            }),
            writeToStableFile({
                filePath: path_1.default.resolve(dirName, `${moduleName}.tsx`),
                content: moduleTypescriptInterfaceFileContent,
            }),
        ]);
    }
    catch (e) { }
}
function generateConciseExpoModuleTSInterfaceCommand(cli) {
    addCommonOptions(cli
        .command('generate-concise-ts')
        .summary('Creates concise ts interface, great with inline-modules.')
        .description('Creates concise ts interface for an expo module. Overrites `ModuleName.generated.ts` and creates `ModuleName.ts` if not present. Can be used with inline-modules.')).action(async (options) => {
        const parsedArgs = await parseCommandArguments(options, false);
        if (!parsedArgs)
            return;
        const command = () => generateConciseTsFiles(parsedArgs);
        runCommandOnWatch(parsedArgs, command);
    });
}
async function writeToStableFile({ filePath, content }) {
    let flag = 'wx';
    if (fs_1.default.existsSync(filePath) &&
        !contentHasChanged(await fs_1.default.promises.readFile(filePath, 'utf-8'))) {
        // Overwrite the file if it wasn't changed since the last generation
        flag = 'w';
    }
    try {
        await fs_1.default.promises.writeFile(filePath, insertFileHashComment(content), {
            flag,
            encoding: 'utf-8',
        });
    }
    catch (e) {
        console.error(`Error writing to file.${e}`);
    }
}
function generateTypeFilesCommand(cli) {
    return addCommonOptions(cli.command('generate-type-files')).action(async (options) => {
        const parsedArgs = await parseCommandArguments(options, false);
        if (!parsedArgs)
            return;
        const { realInputPaths, realOutputPath } = parsedArgs;
        const command = async () => {
            const typeInfo = await getFileTypeInformationFromArgs(parsedArgs);
            if (!typeInfo)
                return;
            const generatedFiles = await (0, typescriptGeneration_1.generateFullTsInterface)(typeInfo);
            if (!generatedFiles)
                return;
            const { moduleTypesFile, moduleViewsFiles, moduleNativeFile, indexFile } = generatedFiles;
            const dirName = realOutputPath ?? path_1.default.dirname(realInputPaths[0]);
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
                const outputFilePath = path_1.default.resolve(dirName, outputFile.name);
                writeFilePromises.push(writeToStableFile({ filePath: outputFilePath, content: outputFile.content }));
            }
            await Promise.all(writeFilePromises);
        };
        runCommandOnWatch(parsedArgs, command);
    });
}
async function getResolvedWatchedDirectoriesFromAppJson(appJsonPath) {
    const watchedDirectories = JSON.parse(await fs_1.default.promises.readFile(appJsonPath, 'utf-8'))?.expo
        ?.experiments?.inlineModules?.watchedDirectories;
    if (!Array.isArray(watchedDirectories)) {
        return null;
    }
    const rootDir = path_1.default.dirname(path_1.default.resolve(appJsonPath));
    return watchedDirectories.map((relativePath) => path_1.default.resolve(rootDir, relativePath));
}
async function generateInlineModulesTypesCommand(cli) {
    return cli
        .command('inline-modules-types')
        .requiredOption('-a --app-json <appJsonPathPath>', 'A path to the `app.json` where the inline.modules.watchedDirectories are defined.')
        .option('-w --watcher', 'Starts a watcher that checks for changes in inline modules files.')
        .action(async (options) => {
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
        const generateInlineModuleTSFiles = async (filePath, dirPath) => {
            await generateConciseTsFiles({
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
        await taskAll(dirents, async (dirent) => await generateInlineModuleTSFiles(dirent.path, dirent.parentPath));
        if (!watcher) {
            return;
        }
        const debouncedInlineModulesTsGeneration = debounce(generateInlineModuleTSFiles);
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
async function main(args) {
    if (!isSourceKittenInstalled()) {
        console.error('Sourcekitten not found! Install it like so: brew install sourcekitten');
        return;
    }
    const cli = new commander_1.Command();
    cli
        .name('expo-type-information')
        .version(require('../package.json').version)
        .description('CLI commands for retrieving type information from native files.');
    generateConciseExpoModuleTSInterfaceCommand(cli);
    generateMocksForFileCommand(cli);
    generateTypeFilesCommand(cli);
    generateInlineModulesTypesCommand(cli);
    const otherCommands = cli.command('other').description('internal or very specific commands');
    typeInformationCommand(otherCommands);
    generateModuleTypesCommand(otherCommands);
    generateViewTypesCommand(otherCommands);
    generateJsxIntrinsics(otherCommands);
    await cli.parseAsync(args, { from: 'user' });
}
main(process.argv.slice(2));
//# sourceMappingURL=cli.js.map