"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = __importDefault(require("commander"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mockgen_1 = require("./mockgen");
const typeInformation_1 = require("./typeInformation");
const typescriptGeneration_1 = require("./typescriptGeneration");
function addCommonOptions(command) {
    return command
        .requiredOption('-i, --input-path <filePath>', 'Path to the Swift file.')
        .option('-o, --output-path <filePath>', 'Path to save the generated output. If this option is not provided the generated output is printed to console.')
        .option('-t, --type-inference <typeInference>', 'Level of type inference: NO_INFERENCE, SIMPLE_INFERENCE, or PREPROCESS_AND_INFERENCE', 'PREPROCESS_AND_INFERENCE');
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
function isInferenceOptionValid(option) {
    return (option === 'NO_INFERENCE' ||
        option === 'SIMPLE_INFERENCE' ||
        option === 'PREPROCESS_AND_INFERENCE');
}
async function parseCommonArgumentsAndGetFileTypeInformation(options) {
    const realInputPath = sanitizeAndValidatePath(options.inputPath);
    if (!realInputPath) {
        console.error(`Path ${options.inputPath} is not a valid path to an existing file.`);
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
    if (!isInferenceOptionValid(options.typeInference)) {
        console.error(`Invalid typeInference option.`);
        return null;
    }
    const typeInfo = await (0, typeInformation_1.getFileTypeInformation)(realInputPath, options.typeInference === 'PREPROCESS_AND_INFERENCE');
    if (!typeInfo) {
        console.log(chalk_1.default.red(`Provided file: ${options.inputPath} couldn't be parsed for type information!`));
        return null;
    }
    return { typeInfo, realOutputPath, realInputPath };
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
        const parsed = await parseCommonArgumentsAndGetFileTypeInformation(options);
        if (!parsed)
            return;
        const { typeInfo, realOutputPath } = parsed;
        const typeInfoSerialized = (0, typeInformation_1.serializeTypeInformation)(typeInfo);
        const typeInfoSerializedString = JSON.stringify(typeInfoSerialized, null, 2);
        writeStringToFileOrPrintToConsole(typeInfoSerializedString, realOutputPath);
    });
}
function generateModuleTypesCommand(cli) {
    return addCommonOptions(cli.command('generate-module-types')).action(async (options) => {
        const parsed = await parseCommonArgumentsAndGetFileTypeInformation(options);
        if (!parsed)
            return;
        const { typeInfo, realInputPath, realOutputPath } = parsed;
        const moduleTypesFileContent = await (0, typescriptGeneration_1.getGeneratedModuleTypesFileContent)(realInputPath, typeInfo);
        writeStringToFileOrPrintToConsole(moduleTypesFileContent, realOutputPath);
    });
}
function generateViewTypesCommand(cli) {
    return addCommonOptions(cli.command('generate-view-types')).action(async (options) => {
        const parsed = await parseCommonArgumentsAndGetFileTypeInformation(options);
        if (!parsed)
            return;
        const { typeInfo, realInputPath, realOutputPath } = parsed;
        const viewTypesFileContent = await (0, typescriptGeneration_1.getGeneratedViewTypesFileContent)(realInputPath, typeInfo);
        if (!viewTypesFileContent) {
            console.error("Couldn't generate view types!");
            return;
        }
        writeStringToFileOrPrintToConsole(viewTypesFileContent, realOutputPath);
    });
}
function generateMocksForFileCommand(cli) {
    return addCommonOptions(cli.command('generate-mocks-for-file')).action(async (options) => {
        const parsed = await parseCommonArgumentsAndGetFileTypeInformation(options);
        if (!parsed)
            return;
        const { typeInfo } = parsed;
        (0, mockgen_1.generateMocks)([typeInfo], 'typescript');
    });
}
function generateJsxIntrinsics(cli) {
    return addCommonOptions(cli.command('generate-jsx-intrinsics')).action(async (options) => {
        const parsed = await parseCommonArgumentsAndGetFileTypeInformation(options);
        if (!parsed)
            return;
        const { typeInfo, realInputPath, realOutputPath } = parsed;
        const jsxIntrinsicViewFileContent = await (0, typescriptGeneration_1.getGeneratedJSXIntrinsicsViewDeclaration)(realInputPath, typeInfo);
        if (!jsxIntrinsicViewFileContent) {
            console.error("Couldn't generate view types!");
            return;
        }
        writeStringToFileOrPrintToConsole(jsxIntrinsicViewFileContent, realOutputPath);
    });
}
async function main(args) {
    const cli = commander_1.default
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
//# sourceMappingURL=cli.js.map