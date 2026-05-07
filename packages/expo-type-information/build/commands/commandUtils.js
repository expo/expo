"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSourceKittenInstalled = isSourceKittenInstalled;
exports.addCommonOptions = addCommonOptions;
exports.debounce = debounce;
exports.runCommandOnWatch = runCommandOnWatch;
exports.getFilesForGlobPattern = getFilesForGlobPattern;
exports.sanitizeAndValidateOutputPath = sanitizeAndValidateOutputPath;
exports.parseInferenceOption = parseInferenceOption;
exports.getPodspecFilePath = getPodspecFilePath;
exports.getSourceFilesGlobFromPodspecFile = getSourceFilesGlobFromPodspecFile;
exports.getModuleFilePathsFromPodspec = getModuleFilePathsFromPodspec;
exports.uniqueStrings = uniqueStrings;
exports.parseCommandArguments = parseCommandArguments;
exports.getFileTypeInformationFromArgs = getFileTypeInformationFromArgs;
exports.writeStringToFileOrPrintToConsole = writeStringToFileOrPrintToConsole;
exports.getContentHash = getContentHash;
exports.contentHasChanged = contentHasChanged;
exports.insertFileHashComment = insertFileHashComment;
exports.writeToStableFile = writeToStableFile;
exports.generateConciseTsFiles = generateConciseTsFiles;
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const crypto_1 = require("crypto");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const typeInformation_1 = require("../typeInformation");
const typescriptGeneration_1 = require("../typescriptGeneration");
const utils_1 = require("../utils");
let sourcekittenInstalled;
function isSourceKittenInstalled() {
    if (sourcekittenInstalled !== undefined) {
        return sourcekittenInstalled;
    }
    try {
        (0, child_process_1.execSync)('which sourcekitten', { stdio: 'ignore' });
        sourcekittenInstalled = true;
    }
    catch {
        sourcekittenInstalled = false;
    }
    return sourcekittenInstalled;
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
async function runCommandOnWatch(parsedArgs, command) {
    const debounced_command = debounce(command, 1000);
    debounced_command();
    if (!parsedArgs.watcher) {
        return;
    }
    await (0, utils_1.taskAll)(parsedArgs.realInputPaths, async (realInputPath) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const _ of fs_1.default.promises.watch(realInputPath)) {
            if (!fs_1.default.existsSync(realInputPath)) {
                return;
            }
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
    catch {
        return null;
    }
}
function sanitizeAndValidateOutputPath(rawPath, isFilePath = true) {
    try {
        const resolvedPath = path_1.default.resolve(rawPath);
        if (fs_1.default.existsSync(resolvedPath)) {
            const pathStat = fs_1.default.statSync(resolvedPath);
            const isValid = isFilePath ? pathStat.isFile() : pathStat.isDirectory();
            return isValid ? resolvedPath : null;
        }
        if (isFilePath && fs_1.default.existsSync(path_1.default.dirname(resolvedPath))) {
            return resolvedPath;
        }
    }
    catch { }
    return null;
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
function getPodspecFilePath(modulePath) {
    const normalizedModulePath = fs_1.default.realpathSync(modulePath).replace(/\\/g, '/');
    const podspecFiles = [...fs_1.default.globSync(`${normalizedModulePath}/ios/*.podspec`)];
    const podspecFile = podspecFiles[0];
    return podspecFile ?? null;
}
function getSourceFilesGlobFromPodspecFile(podspecPath) {
    const podspecContent = fs_1.default.readFileSync(podspecPath, 'utf8');
    const sourceFilesRegex = /\.source_files\s*=\s*(["'])(.*?)\1/;
    const match = podspecContent.match(sourceFilesRegex);
    return match?.[2] ?? null;
}
function getModuleFilePathsFromPodspec(modulePath) {
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
    const podspecDir = path_1.default.dirname(podspecPath);
    const absoluteGlobPattern = path_1.default.posix.join(podspecDir.replace(/\\/g, '/'), extractedGlob);
    return getFilesForGlobPattern(absoluteGlobPattern)?.filter((f) => f.endsWith('.swift')) ?? null;
}
function uniqueStrings(strings) {
    return [...new Set(strings)];
}
function parseCommandArguments(options, isOutputFile = true) {
    const appJsonPath = options.appJson ?? undefined;
    let realInputPaths = (options.inputPaths ?? [])
        .flatMap(getFilesForGlobPattern)
        .filter((p) => p != null);
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
        console.error(chalk_1.default.red(`Provided files: ${realInputPaths} couldn't be parsed for type information!`));
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
function getContentHash(content) {
    return (0, crypto_1.createHash)('sha256').update(content).digest('hex');
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
async function writeToStableFile({ filePath, content, }) {
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
        console.error('Error writing to a file.', e);
    }
}
async function generateConciseTsFiles(parsedArgs) {
    const { realInputPaths, realOutputPath } = parsedArgs;
    const typeInfo = await getFileTypeInformationFromArgs(parsedArgs);
    if (!typeInfo) {
        return;
    }
    const { volatileGeneratedFileContent, moduleTypescriptInterfaceFileContent } = await (0, typescriptGeneration_1.generateConciseTsInterface)(typeInfo);
    const moduleName = typeInfo.moduleClasses[0]?.name ?? 'UnknownModuleName';
    const dirName = realOutputPath ?? path_1.default.dirname(realInputPaths[0]);
    try {
        await Promise.all([
            fs_1.default.promises.writeFile(path_1.default.resolve(dirName, `${moduleName}.generated.ts`), volatileGeneratedFileContent, {
                flag: 'w',
                encoding: 'utf-8',
            }),
            writeToStableFile({
                filePath: path_1.default.resolve(dirName, `${moduleName}.tsx`),
                content: moduleTypescriptInterfaceFileContent,
            }),
        ]);
    }
    catch (e) {
        console.error(`Error writing to a file.`, e);
    }
}
//# sourceMappingURL=commandUtils.js.map