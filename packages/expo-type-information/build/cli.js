"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = require("commander");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mockgen_1 = require("./mockgen");
const typeInformation_1 = require("./typeInformation");
const typescriptGeneration_1 = require("./typescriptGeneration");
function addCommonOptions(command) {
    return command
        .requiredOption('-i, --input-paths <filePaths...>', 'Paths to Swift files. First file provided should be the file with the Native module')
        .option('-o, --output-path <filePath>', 'Path to save the generated output. If this option is not provided the generated output is printed to console.')
        .option('-t, --type-inference <typeInference>', 'Level of type inference: NO_INFERENCE, SIMPLE_INFERENCE, or PREPROCESS_AND_INFERENCE', 'PREPROCESS_AND_INFERENCE')
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
function sanitizeAndValidatePath(rawPath) {
    try {
        const resolvedPath = path_1.default.resolve(rawPath);
        if (!fs_1.default.existsSync(resolvedPath)) {
            return null;
        }
        if (!fs_1.default.statSync(resolvedPath).isFile()) {
            return null;
        }
        return fs_1.default.realpathSync(resolvedPath);
    }
    catch (error) {
        return null;
    }
}
function sanitizeAndValidateOutputPath(rawPath) {
    try {
        const resolvedPath = path_1.default.resolve(rawPath);
        if (fs_1.default.existsSync(resolvedPath)) {
            if (!fs_1.default.statSync(resolvedPath).isFile()) {
                return null;
            }
        }
        else {
            const parentDir = path_1.default.dirname(resolvedPath);
            if (!fs_1.default.existsSync(parentDir)) {
                return null;
            }
        }
        return resolvedPath;
    }
    catch (error) {
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
function parseCommandArguments(options) {
    const realInputPaths = options.inputPaths
        .map(sanitizeAndValidatePath)
        .filter((p) => p != null);
    if (!realInputPaths || realInputPaths.length == 0) {
        console.error(`Provide valid paths to existing files.`);
        return null;
    }
    let realOutputPath = undefined;
    if (options.outputPath) {
        const validatedOutPath = sanitizeAndValidateOutputPath(options.outputPath);
        if (!validatedOutPath) {
            console.error(`Output path ${options.outputPath} is not valid, is a directory, or its parent directory does not exist.`);
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
function generateConciseExpoModuleTSInterfaceCommand(cli) {
    addCommonOptions(cli
        .command('generate-concise-ts')
        .summary('Creates concise ts interface, great with inline-modules.')
        .description('Creates concise ts interface for an expo module. Overrites `ModuleName.generated.ts` and creates `ModuleName.ts` if not present. Can be used with inline-modules.')).action(async (options) => {
        const parsedArgs = await parseCommandArguments(options);
        if (!parsedArgs)
            return;
        const { realInputPaths, realOutputPath } = parsedArgs;
        const command = async () => {
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
                    fs_1.default.promises.writeFile(path_1.default.resolve(dirName, `${moduleName}.tsx`), moduleTypescriptInterfaceFileContent, {
                        flag: 'wx',
                        encoding: 'utf-8',
                    }),
                ]);
            }
            catch (e) { }
        };
        runCommandOnWatch(parsedArgs, command);
    });
}
function generateTypeFiles(cli) {
    return addCommonOptions(cli.command('generate-type-files')).action(async (options) => {
        const parsedArgs = await parseCommandArguments(options);
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
            const { moduleTypesFile, moduleViewFile, moduleNativeFile, indexFile } = generatedFiles;
            const dirName = realOutputPath ?? path_1.default.dirname(realInputPaths[0]);
            const writeFilePromises = [];
            for (const outputFile of [moduleTypesFile, moduleViewFile, moduleNativeFile, indexFile]) {
                if (!outputFile) {
                    continue;
                }
                writeFilePromises.push(fs_1.default.promises.writeFile(path_1.default.resolve(dirName, outputFile.name), outputFile.content, {
                    flag: 'wx',
                    encoding: 'utf-8',
                }));
            }
            try {
                await Promise.all(writeFilePromises);
            }
            catch (e) {
                console.error(`Error writing to file.${e}`);
            }
        };
        runCommandOnWatch(parsedArgs, command);
    });
}
async function main(args) {
    const cli = new commander_1.Command();
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
//# sourceMappingURL=cli.js.map